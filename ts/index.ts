import { formatDistanceToNowStrict } from 'date-fns'
import { SearchResults, Friends, Presence } from './xblio'
import express, { Request, Response } from 'express'
import fetch from 'cross-fetch'
import dotenv from 'dotenv'
import path from 'path'

import searchTemplate from '../pug/search.pug'
import friendsTemplate from '../pug/friends.pug'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const { XBLIO_SECRET } = process.env
if (!XBLIO_SECRET) throw new Error('Missing XBLIO_SECRET')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queryStr = (obj: { [key: string]: any }) =>
  Object.keys(obj)
    .map(k => `${k}=${obj[k]}`)
    .join('&')

express()
  .use(express.static(path.join(__dirname, './static')))
  .get('/', async (req, res) => {
    let xuid = req.query.xuid

    if (!xuid && 'gt' in req.query) {
      console.log('attempting to find xuid by gamertag "' + req.query.gt + '"')
      try {
        xuid = await getXuid(req.query.gt.toString())
        return res.redirect(`/?xuid=${xuid}&${queryStr(req.query)}`)
      } catch (e) {
        console.error(e)
        return res.sendStatus(404)
      }
    }

    if (xuid) {
      return await friendsPage(req, res)
    } else {
      return searchPage(req, res)
    }
  })
  .listen(process.env.PORT || 8080, () => console.log('server started'))

// ------

const headers = { 'X-Authorization': XBLIO_SECRET, Accept: 'application/json' }

async function getXuid(gamertag: string) {
  try {
    const res = (await (await fetch(`https://xbl.io/api/v2/friends/search?gt=${gamertag}`, { headers })).json()) as SearchResults
    const { id } = res['profileUsers'][0]
    if (!id) throw new Error(`XUID is ${id}`)
    return id
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

/** Gets the user's options from URL params */
const options = (req: Request) => ({
  sortOrder: req.query.sortOrder || 'lastOnline',
  indicatorStyle: req.query.indicatorStyle || 'border',
  onlineOnly: req.query.onlineOnly == 'on' || false,
  games: req.query.games == 'on' || true,
  lastSeenTime: req.query.lastSeenTime == 'on' || true,
  playingTime: req.query.playingTime == 'on' || true,
  icons: req.query.icons == 'on' || true
})

function searchPage(req: Request, res: Response) {
  return res.send(searchTemplate(options(req)))
}

async function friendsPage(req: Request, res: Response): Promise<void> {
  const {
    xuid,
    onlineOnly = false,
    games = true,
    lastSeenTime = true,
    playingTime = true,
    icons = true,
    sortOrder = 'lastOnline'
  } = req.query

  console.log(`[XUID ${xuid}] Searching for friends`)
  if (!xuid) {
    res.redirect('/?' + queryStr({ ...req.query, error: 'Invalid XUID' }))
  }

  let peopleList: Friends['people']
  let presenceList: Presence

  try {
    peopleList = ((await (await fetch('https://xbl.io/api/v2/friends?xuid=' + xuid, { headers })).json()) as Friends).people
    console.log(`[XUID ${xuid}] Found ${peopleList.length} friends`)

    presenceList = (await (await fetch(`https://xbl.io/api/v2/${peopleList.map(p => p.xuid)}/presence`, { headers })).json()) as Presence
    if (!presenceList.length) throw new Error('No presence data')
    console.log(`[XUID ${xuid}] Found ${presenceList.length} presence records`)
  } catch (e) {
    // remove xuid from query string
    req.query = Object.entries(req.query)
      .filter(([k]) => k !== 'xuid' && k !== 'gt')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {})
    return res.redirect('/?' + queryStr({ ...req.query, error: 'Could not find presence records. Please try again.' }))
  }

  const people: {
    name?: string
    img?: string
    status?: 'Online' | 'Offline'
    rich?: string
  }[] = []

  type Sorter = (a: Presence[number], b: Presence[number]) => number

  /** Sorting functions, to be chained together as necessary */
  const sortBy: { [key: string]: Sorter } = {
    name(a, b) {
      const friendA = peopleList.find(p => p.xuid == a.xuid)
      const friendB = peopleList.find(p => p.xuid == b.xuid)
      return friendA.displayName.localeCompare(friendB.displayName)
    },

    game: (a, b) => {
      let gameA = 'devices' in a ? a.devices[0].titles[0].name : 'lastSeen' in a ? a.lastSeen.titleName : ''
      if (gameA == 'Online' || gameA == 'Home') gameA = ''
      let gameB = 'devices' in b ? b.devices[0].titles[0].name : 'lastSeen' in b ? b.lastSeen.titleName : ''
      if (gameB == 'Online' || gameB == 'Home') gameB = ''

      if (gameA && !gameB) return -1
      if (!gameA && gameB) return 1

      return gameA.localeCompare(gameB)
    },

    richStatus: (a, b) => {
      if ('devices' in a && !('devices' in b)) return -1
      if (!('devices' in a) && 'devices' in b) return 1

      if ('devices' in a && 'devices' in b) {
        return (a.devices[0].titles[0].activity?.richPresence || '').localeCompare(b.devices[0].titles[0].activity?.richPresence || '')
      }
    },

    ifOnline: (a, b) => {
      // move online players to the beginning
      if (a.state == 'Offline' && b.state == 'Online') return 1
      if (a.state == 'Online' && b.state == 'Offline') return -1
      return 0
    },

    ifPlayTimeAvalible: (a, b) => {
      // sort by whether we know how long they have been playing
      if ('devices' in a && !('devices' in b)) return 1
      if ('devices' in b && !('devices' in a)) return -1
      return 0
    },

    playtime: (a, b) => {
      if ('devices' in a && 'devices' in b) {
        const friendATime = new Date(a.devices[0].titles[a.devices[0].titles.length - 1].lastModified).getTime()
        const friendBTime = new Date(b.devices[0].titles[b.devices[0].titles.length - 1].lastModified).getTime()

        return friendATime - friendBTime
      }
      return 0
    },

    ifLastSeenAvalible: (a, b) => {
      // sort by whether there is last seen data
      if (!('lastSeen' in a) && 'lastSeen' in b) return 1
      if (!('lastSeen' in b) && 'lastSeen' in a) return -1
      return 0
    },

    lastSeenTime: (a, b) => {
      if ('lastSeen' in a && 'lastSeen' in b) {
        return new Date(b.lastSeen.timestamp).getTime() - new Date(a.lastSeen.timestamp).getTime()
      }
      return 0
    },

    lastSeenGame: (a, b) => {
      if ('lastSeen' in a && 'lastSeen' in b) {
        return a.lastSeen.titleName.localeCompare(b.lastSeen.titleName)
      }
      return 0
    }
  }

  /**
   * The function to be called to sort the players. This can be overwritten as needed.
   *
   * The function will call different sorting algorithms, falling back to the next in case the previous one returns 0.
   */
  let sortFn: Sorter = (a, b) =>
    sortBy.ifOnline(a, b) ||
    sortBy.ifLastSeenAvalible(a, b) ||
    sortBy.lastSeenTime(a, b) ||
    // by this point both players should be online
    sortBy.ifPlaytimeAvalible(a, b) ||
    sortBy.name(a, b) ||
    0

  if (sortOrder == 'game') {
    sortFn = (a, b) =>
      sortBy.ifOnline(a, b) ||
      sortBy.ifLastSeenAvalible(a, b) ||
      sortBy.lastSeenGame(a, b) ||
      sortBy.game(a, b) ||
      sortBy.richStatus(a, b) ||
      sortBy.name(a, b) ||
      0
  } else if (sortOrder == 'name') {
    sortFn = (a, b) => sortBy.ifOnline(a, b) || sortBy.name(a, b) || 0
  } else if (sortOrder && sortOrder !== 'lastOnline') {
    console.warn(`[XUID ${xuid}] Sort order "${sortOrder}" is not supported.`)
  }

  presenceList.sort(sortFn).forEach(p => {
    if (p.state == 'Offline' && onlineOnly) return

    const obj: FriendsObject['people'][number] = {}

    const listDat = peopleList.find(f => f.xuid === p.xuid)
    obj.name = listDat.displayName
    obj.img = icons ? listDat.displayPicRaw : ''
    obj.status = p.state

    if ('lastSeen' in p) {
      // Filter out "Home" and "Online" titles
      if (p.lastSeen.titleName == 'Home' || p.lastSeen.titleName == 'Online') {
        obj.rich = lastSeenTime ? `Last seen ${formatDistanceToNowStrict(new Date(p.lastSeen.timestamp))} ago` : ''
      } else {
        if (games && p.lastSeen.titleName) {
          obj.rich = `Last seen ${lastSeenTime ? formatDistanceToNowStrict(new Date(p.lastSeen.timestamp)) + ' ago' : ''} on ${
            p.lastSeen.titleName
          }`
        } else {
          obj.rich = lastSeenTime ? `Last seen ${formatDistanceToNowStrict(new Date(p.lastSeen.timestamp))} ago` : ''
        }
      }
    } else if ('devices' in p) {
      p.devices.forEach(d => {
        // use the last title to determine how long this person was online because the first title changes when they start doing something different within the game, and that resets the timestamp.
        const onlineTime = formatDistanceToNowStrict(new Date(d.titles[d.titles.length - 1].lastModified))

        // Filter out "Home" and "Online" titles
        if (d.titles[0].name == 'Home' || d.titles[0].name == 'Online') {
          obj.rich = playingTime ? `Online for ${onlineTime}` : ''
        } else {
          obj.rich = [
            games && `On ${d.titles[0].name}${'activity' in d.titles[0] ? `, ${d.titles[0].activity.richPresence}` : ''}`,
            playingTime && `for ${onlineTime}`
          ]
            .filter(a => a)
            .join(', ')
        }
      })
    }

    people.push(obj)
  })

  res.send(friendsTemplate({ people, ...options(req) }))
}
