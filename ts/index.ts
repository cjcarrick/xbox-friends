import { formatDistanceToNowStrict } from 'date-fns'
import { SearchResults, Friends, Presence, Account } from './xblio'
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
        console.log(req.query)
        return res.redirect(`/?xuid=${xuid}&${queryStr(req.query)}`)
      } catch (e) {
        console.error(e)
        return res.sendStatus(404)
      }
    }

    if (xuid) {
      return await friendsPage(req, res)
    } else {
      return res.send(searchTemplate({ options: options(req) }))
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
  self: {
    name: string
    img: string
    state: 'Online' | 'Offline'
    rich?: string
    url: string
  }
  friends: {
    name: string
    img: string
    state: 'Online' | 'Offline'
    rich: string
    url: string
  }[]
}

/** Gets the user's options from URL params */
const options = (req: Request) => ({
  sortOrder: req.query.sortOrder || 'lastOnline',
  indicatorStyle: req.query.indicatorStyle || 'border',
  onlineOnly: req.query.onlineOnly || 'off',
  games: req.query.games || 'on',
  lastSeenTime: req.query.lastSeenTime || 'on',
  playingTime: req.query.playingTime || 'on',
  icons: req.query.iconse || 'on',
  showSelf: req.query.showSelf || 'on'
})

async function friendsPage(req: Request, res: Response): Promise<void> {
  const {
    onlineOnly = false,
    games = false,
    lastSeenTime = false,
    playingTime = false,
    icons = false,
    sortOrder,
    showSelf = false
  } = Object.fromEntries(
    Object.entries(options(req)).map(([k, v]) => {
      v = v.toString()
      return [k, v == 'on' ? true : v == 'off' ? false : v]
    })
  )

  const { xuid } = req.query

  console.log(`[XUID ${xuid}] Searching for friends`)
  // if (!xuid) res.redirect('/?' + queryStr({ ...options(req), error: 'Invalid XUID' }))
  if (!xuid) {
    return res.send(searchTemplate({ options: options(req), error: 'Invalid XUID.' })) as unknown as void
  }

  let peopleList: Friends['people']
  let presenceList: Presence
  let selfData: Account

  try {
    if (showSelf) selfData = (await (await fetch('https://xbl.io/api/v2/account/' + xuid, { headers })).json()) as Account

    peopleList = ((await (await fetch('https://xbl.io/api/v2/friends?xuid=' + xuid, { headers })).json()) as Friends).people
    console.log(`[XUID ${xuid}] Found ${peopleList.length} friends`)

    // Get presence data for the friends list, and us if we are going to draw outself on the page
    const xuids = showSelf ? [selfData.profileUsers[0].id, ...peopleList.map(p => p.xuid)] : peopleList.map(p => p.xuid)
    presenceList = (await (await fetch(`https://xbl.io/api/v2/${xuids}/presence`, { headers })).json()) as Presence
    if (!presenceList.length) throw new Error('No presence data')
    console.log(`[XUID ${xuid}] Found ${presenceList.length} presence records`)
  } catch (e) {
    return res.send(
      searchTemplate({ options: options(req), error: 'Could not find presence records. Please try again.' })
    ) as unknown as void
    // return res.redirect('/?' + queryStr({ options: options(req), error: 'Could not find presence records. Please try again.' }))
  }

  /**
   * Determines the rich presence of a player, respecting the user's preferences.
   *
   * This function may find when they were last online, what they are doing in a specific game right now, or an empty string if nothing
   * could be determined.
   */
  const richPresenceText = (p: Presence[number]): string => {
    if ('lastSeen' in p) {
      if (p.lastSeen.titleName == 'Home' || p.lastSeen.titleName == 'Online') {
        return lastSeenTime ? `Last seen ${formatDistanceToNowStrict(new Date(p.lastSeen.timestamp))} ago` : ''
      } else {
        if (games && p.lastSeen.titleName) {
          return `Last seen ${lastSeenTime ? formatDistanceToNowStrict(new Date(p.lastSeen.timestamp)) + ' ago' : ''} on ${
            p.lastSeen.titleName
          }`
        } else {
          return lastSeenTime ? `Last seen ${formatDistanceToNowStrict(new Date(p.lastSeen.timestamp))} ago` : ''
        }
      }
    } else if ('devices' in p) {
      let totalTimeOnline = 0
      const activeGames = p.devices
        .map(d =>
          d.titles
            .map(t => {
              const time = formatDistanceToNowStrict(new Date(t.lastModified))

              // Filter out "Home" and "Online" titles
              if (t.name == 'Home' || t.name == 'Online' || !t.name) {
                if (totalTimeOnline < new Date(t.lastModified).getTime()) {
                  totalTimeOnline = new Date(t.lastModified).getTime()
                }
              } else {
                return [games && `On ${t.name}${'activity' in t ? `, ${t.activity.richPresence}` : ''}`, playingTime && `for ${time}`]
                  .filter(a => a)
                  .join(' ')
              }
            })
            .filter(a => a)
            .join(', ')
        )
        .join(', ')
      return playingTime && totalTimeOnline
        ? `Online for ${formatDistanceToNowStrict(new Date(totalTimeOnline))}${activeGames ? ', ' + activeGames : ''}`
        : activeGames
    } else {
      return ''
    }
  }

  const selfPresenceData = selfData && presenceList.find(p => p.xuid == selfData.profileUsers[0].id)
  const result: FriendsObject = {
    self: showSelf
      ? {
          name: selfData.profileUsers[0].settings.find(s => s.id == 'Gamertag').value,
          img: selfData.profileUsers[0].settings.find(s => s.id == 'GameDisplayPicRaw').value,
          state: selfPresenceData.state,
          url: req.url,
          rich: richPresenceText(selfPresenceData)
        }
      : undefined,
    friends: []
  }

  type Sorter = (a: Presence[number], b: Presence[number]) => number

  /** Sorting functions, to be chained together as necessary */
  const sortBy: { [key: string]: Sorter } = {
    name(a, b) {
      const friendA = peopleList.find(p => p.xuid == a.xuid)
      const friendB = peopleList.find(p => p.xuid == b.xuid)
      return (friendA?.displayName || '').localeCompare(friendB?.displayName || '')
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
    sortBy.ifPlayTimeAvalible(a, b) ||
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

  presenceList
    // Remove ourselves from the list of friends.
    // We got it in the request before so we could draw ourselves at the top of the page.
    // But now, we are drawing a list of our friends and don't need this.
    .filter(p => p.xuid !== xuid)

    .sort(sortFn)
    .forEach(p => {
      if (p.state == 'Offline' && onlineOnly) return
      const listDat = peopleList.find(f => f.xuid === p.xuid)

      result.friends.push({
        name: listDat.displayName,
        img: icons ? listDat.displayPicRaw : '',
        state: p.state,
        url: `/?xuid=${p.xuid}&${queryStr(options(req))}`,
        rich: richPresenceText(p) || richPresenceText(p) || ''
      })
    })

  res.send(friendsTemplate({ result, options: options(req) }))
}
