
module.exports = {
  getIP,
  isInn,
  isOut
};

function getIP (req) {
  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (ip.substr(0, 7) == "::ffff:") {
    ip = ip.substr(7);
  }
  return ip;
}

function isInn (ip) {
  return (ip.indexOf(process.env.INN_NET) == 0) ? true : false;
}

function isOut (ip) {
  return (ip.indexOf(process.env.OUT_NET) == 0) ? true : false;
}