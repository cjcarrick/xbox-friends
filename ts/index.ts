import { formatDistanceToNow } from 'date-fns'
import { SearchResults, Friends, Presence } from './xblio'
import express from 'express'
import fetch from 'cross-fetch'
import dotenv from 'dotenv'
import path from 'path'
import sass from 'sass'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const { XBLIO_SECRET } = process.env
if (!XBLIO_SECRET) throw new Error('Missing XBLIO_SECRET')

express()
  .get('/', async (req, res) => {
    let xuid = req.query.xuid
    if (!xuid && 'gt' in req.query) {
      console.log('attempting to find xuid by gamertag "' + req.query.gt + '"')
      xuid = await getXuid(req.query.gt.toString())
      return res.redirect(`/?xuid=${xuid}`)
    }

    if (xuid) {
      return res.send(require('../pug/friends.pug')(await getFriends(xuid.toString())))
    } else {
      return res.send(require('../pug/form.pug')())
    }
  })
  .get('/style.css', (req, res) => {
    res.type('css').send(sass.compile(path.join(__dirname, '../scss/style.scss'), { sourceMap: false, style: 'compressed' }).css)
  })
  .listen(process.env.PORT || 8080, () => console.log('server started'))

// ------

const headers = { 'X-Authorization': XBLIO_SECRET, Accept: 'application/json' }

async function getXuid(gamertag: string) {
  try {
    return ((await (await fetch(`https://xbl.io/api/v2/friends/search?gt=${gamertag}`, { headers })).json()) as SearchResults)[
      'profileUsers'
    ][0]['id']
  } catch (e) {
    console.error('Unable to get xuid for ' + gamertag)
    console.error(e)
    return null
  }
}

/** The object that pug expects. Defined here to ensure consistency. */
type FriendsObject = {
  people: {
    name?: string
    img?: string
    status?: 'Online' | 'Offline'
    rich?: string
  }[]
}

/** Used when profile pictures are unavalible. */
const placeholderImg = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'

async function getFriends(xuid: string): Promise<FriendsObject> {
  console.log(`[XUID ${xuid}] Searching for friends`)

  const friendsList = (await (await fetch('https://xbl.io/api/v2/friends?xuid=' + xuid, { headers })).json()) as Friends

  console.log(`[XUID ${xuid}] Found ${friendsList.people.length} friends`)

  const presenceList = (await (
    await fetch(`https://xbl.io/api/v2/${friendsList.people.map(p => p.xuid)}/presence`, { headers })
  ).json()) as Presence

  console.log(`[XUID ${xuid}] Found ${presenceList.length} presence records`)

  let res: FriendsObject = { people: [] }

  presenceList
    // sort alphabetically by gamertag
    .sort((a, b) => {
      const gt1 = friendsList.people.find(p => p.xuid === a.xuid)
      const gt2 = friendsList.people.find(p => p.xuid === b.xuid)
      return gt1.displayName.localeCompare(gt2.displayName)
    })

    // move online players to the top
    .sort((a, b) => (a.state == 'Online' ? -1 : 1))

    // append to the result
    .forEach(p => {
      let obj: FriendsObject['people'][number] = {}

      const listDat = friendsList.people.find(f => f.xuid === p.xuid)
      obj.name = listDat.displayName
      obj.img = listDat.useAvatar ? placeholderImg : listDat.displayPicRaw
      obj.status = p.state

      if ('lastSeen' in p) {
        // Filter out "Home" and "Online" titles
        if (p.lastSeen.titleName == 'Home' || p.lastSeen.titleName == 'Online') {
          obj.rich = `Last seen ${formatDistanceToNow(new Date(p.lastSeen.timestamp))} ago`
        } else {
          obj.rich = `Last seen on ${p.lastSeen.titleName}, ${formatDistanceToNow(new Date(p.lastSeen.timestamp))} ago`
        }
      } else if ('devices' in p) {
        p.devices.forEach(d => {
          d.titles.forEach(t => {
            // Filter out "Home" and "Online" titles
            if (t.name == 'Home' || t.name == 'Online') {
              obj.rich = `Online for ${formatDistanceToNow(new Date(t.lastModified))}`
            } else {
              obj.rich = `On ${t.name}${'activity' in t ? `, ${t.activity.richPresence}, ` : ', '}for ${formatDistanceToNow(
                new Date(t.lastModified)
              )}`
            }
          })
        })
      }

      res.people.push(obj)
    })

  return res
}
