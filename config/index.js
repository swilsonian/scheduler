// TODO: Set URLs for different environments

// PRODUCTION
// Run as:
// NODE_ENV=production node server.js 
if (process.env.NODE_ENV === 'production') {
  module.exports = {
    port: process.env.PORT || 9001,
    cardAdminURL: process.env.cardAdminURL || '',
    vPlusURL: process.env.vPlusURL || '',
    cardPlusWebURL: process.env.cardPlusWebURL || ''
  };

  console.log(new Date().toString());
  console.log(`production port = ${module.exports.port}`);
}

// STAGING
// Run as:
// NODE_ENV=staging node server.js
else if (process.env.NODE_ENV === 'staging') {
  module.exports = {
    port: process.env.PORT || 9001,

    cardAdminURL: process.env.cardAdminURL || '',
    vPlusURL: process.env.vPlusURL || '',
    cardPlusWebURL: process.env.cardPlusWebURL || ''
  };
  console.log(new Date().toString());
  console.log(`staging port = ${module.exports.port}`);
}

// DEV
// Run as:
// NODE_ENV=dev node server.js
else if (process.env.NODE_ENV === 'dev') {
  module.exports = {
    port: process.env.PORT || 9001,
    cardAdminURL: process.env.cardAdminURL || '',
    vPlusURL: process.env.vPlusURL || '',
    cardPlusWebURL: process.env.cardPlusWebURL || ''
  };
  console.log(new Date().toString());
  console.log(`dev port = ${module.exports.port}`);
}
// LOCAL
// Run as:
// node server.js
else {
  module.exports = {
    port: process.env.PORT || 9001,
    cardAdminURL: process.env.cardAdminURL || 'http://yahoo.com',
    vPlusURL: process.env.vPlusURL || 'http://yahoo.com',
    cardPlusWebURL: process.env.cardPlusWebURL || 'http://yahoo.com'
  };
  console.log(new Date().toString());
  console.log(`local port = ${module.exports.port}`);
}
