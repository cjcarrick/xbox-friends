### This `native` branch attempts to fetch data directly from Microsoft.

<hr></hr>

### [xbox-friends.herokuapp.com](https://xbox-friends.herokuapp.com)

Quickly check if if any of your friends on Xbox are online. Designed for mobile, but also works on desktop.

Designed to be fast; with no javascript, hardly any css, and even less html. Page loads may be slow because api requests need to be made sequentially, and need to be re-run each time for the most up-to-date information.

The root page is only there for you to be able to search for your friends list by gamertag. Once you are redirected to a page with a `xuid` query, you can save that page for later use.

### Running

_`.env.local` requires a `XBLIO_SECRET`. These can be created at https://xbl.io._

```
yarn && yarn build && yarn start
```

### Development

```
yarn && yarn watch & yarn dev
```

#### TODO

- [x] Add fallbacks for profile pictures that fail to load on the DOM
- [x] Alphabetize the friends list
  - [x] Add more sorting functions
- [ ] Add an option to downscale images before they are loaded by the user. This is useful because the raw images are quite large and take a while to load.

- [ ] Find a faster API
  - [ ] Perhaps one that can get gamerpics for users with avatars as their profile picture. Xbl.io doesn't have images for these
