export default Object.freeze({
  CHAT_TYPE: Object.freeze({
    P2P: 1,
    GROUP: 2
  }),

  MESSAGE_TYPE: Object.freeze({
    NORMAL: 1,
    IMAGE: 2,
    VIDEO: 2
  }),

  MESSAGE_STATUS: Object.freeze({
    DELIVERED: 1,
    SEEN: 2
  }),

  USER_ROLE: Object.freeze({
    USER: 1,
    ADMIN: 2,
    GUEST: 3
  }),

  USER_STATUS: Object.freeze({
    ONLINE: 1,
    OFFLINE: 2
  }),

  chatPopulate: [
    { path: "sId", select: 'fname lname profileUrl' },
    { path: "rId", select: 'fname lname profileUrl' },
    { path: "gId", select: 'fname lname profileUrl' }
  ]

})
