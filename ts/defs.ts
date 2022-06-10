declare module '*.pug' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: (templateParameters?: { [key: string]: any }) => string
  export default value
}
