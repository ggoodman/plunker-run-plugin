module.exports = {
  matches: /\.base64(\..+)$/,
  provides: function (pathname) {
    return pathname.replace(/^.*\.base64(\..+)$/, '$1');
  },
  transform: function (context) {
    return {
      payload: new Buffer(context.sourceContent, 'base64'),
      encoding: 'binary',
    };
  }
};
