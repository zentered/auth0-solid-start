import { storage } from '../session'
export const getSession = async (event) =>
  storage.getSession(event.request.headers.get('Cookie'))
