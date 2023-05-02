/**
 *
 * @param input a cli command full line
 * @returns an array of cmd and args
 */
export const parseCmd = (input: string) => input.trim().split(/ (.*)/)
