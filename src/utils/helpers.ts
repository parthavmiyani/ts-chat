import { v4 as uuidv4 } from 'uuid';

class Helper {
  generateUUID() {
    return uuidv4()
  }
}


export default new Helper()