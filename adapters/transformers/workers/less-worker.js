var Less = require("less");

module.exports =  function (request, reply) {
  Less.render(request, function (e, output) {
    if (e) return reply(e);
    
    reply(null, output.css);
  });
};