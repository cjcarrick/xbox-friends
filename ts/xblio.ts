type SearchResults = {
  profileUsers: [
    {
      id: string
      hostId: string
      settings: [
        { id: 'GameDisplayPicRaw'; value: string },
        { id: 'Gamerscore'; value: string },
        { id: 'Gamertag'; value: string },
        { id: 'AccountTier'; value: string },
        { id: 'XboxOneRep'; value: string },
        { id: 'PreferredColor'; value: string },
        { id: 'RealName'; value: string },
        { id: 'Bio'; value: string },
        { id: 'TenureLevel'; value: string },
        { id: 'Watermarks'; value: string },
        { id: 'Location'; value: string },
        { id: 'ShowUserAsAvatar'; value: string }
      ]
      isSponsoredUser: false
    }
  ]
}

type Friends = {
  recommendationSummary: null
  friendFinderState: null
  people: {
    useAvatar: boolean
    titlePresence: null
    recentPlayer: null
    communityManagerTitles: null
    detail: null
    isFavorite: true
    isFollowedByCaller: true
    presenceText: string
    follower: null
    isBroadcasting: true
    preferredColor: {
      primaryColor: string
    }
    presenceTitleIds: null
    addedDateTimeUtc: string
    displayPicRaw: string
    gamerScore: string
    isIdentityShared: true
    realName: string
    presenceDevices: null
    recommendation: null
    presenceDetails: null
    isCloaked: null
    avatar: null
    xboxOneRep: string
    isQuarantined: true
    suggestion: null
    isFollowingCaller: true
    titleHistory: null
    broadcast: []
    gamertag: string
    xuid: string
    multiplayerSummary: { InMultiplayerSession: number; InParty: number }
    tournamentSummary: null
    presenceState: string
    titleSummaries: null
    socialManager: { pages: unknown[]; titleIds: unknown[] }
    displayName: string
  }[]
}
type Presence = ({
  /** Eg: `2535467737715406` */
  xuid: string
} & (
  | {
      state: 'Online'
      devices: {
        /** Eg: `WindowsOneCore` */
        type: string
        titles: {
          activity?: {
            /** Eg: `Onboarding` */
            richPresence: string
          }
          /** Eg: `1777860928` */
          id: string
          /** Eg: `Full` */
          placement: string
          /** Eg: `Active` */
          state: string
          /** Eg: `Microsoft Flight Simulator` */
          name: string
          /** Eg: `2022-06-05T23:41:50.8148827Z` */
          lastModified: string
        }[]
      }[]
    }
  | {
      state: 'Offline'
      lastSeen?: {
        titleName: string
        titleId: string
        timestamp: string
        deviceType: string
      }
    }
))[]

type Account = {
  profileUsers: [
    {
      id: string
      hostId: string
      settings: [
        { id: 'GameDisplayPicRaw'; value: string },
        { id: 'Gamerscore'; value: string },
        { id: 'Gamertag'; value: string },
        { id: 'AccountTier'; value: string },
        { id: 'XboxOneRep'; value: string },
        { id: 'PreferredColor'; value: string },
        { id: 'RealName'; value: string },
        { id: 'Bio'; value: string },
        { id: 'Location'; value: string }
      ]
      isSponsoredUser: boolean
    }
  ]
}

export { SearchResults, Friends, Presence, Account }
