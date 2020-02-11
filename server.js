const nodeSchedule = require('node-schedule');
const notifyDevTeam = require('./lib/notifyDevTeam');
const Log = require('./lib/logger');
let config = require('./config');
let Request = require('request');

/*
 // schedule.scheduleJob('* * * * * *', ()=> { //'s m h dd mm day of week'();
 *    *    *    *    *    *
 ┬    ┬    ┬    ┬    ┬    ┬
 │    │    │    │    │    │
 │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
 │    │    │    │    └───── month (1 - 12)
 │    │    │    └────────── day of month (1 - 31)
 │    │    └─────────────── hour (0 - 23)
 │    └──────────────────── minute (0 - 59)
 └───────────────────────── second (0 - 59, OPTIONAL)
 /* */

let cardAdminURLHeadersObj = {
  authorization: 'none'
};

let cardPlusWebHeadersObj = {
  authorization: 'none'
};

let vPlusHeadersObj= {
  authorization: 'none'
};



let DEFAULT_TZ = 'Asia/Taipei'; // 'US/Eastern';

// Put your jobs in this array
// SRC: https://docs.google.com/spreadsheets/d/1GcKwaXouiyViZUgO7OLXjwgk6wqWflBKNJAa5oXREGM/edit#gid=0
let jobs = [
  // TEST
  // {
  //     name: 'TEST GOOGLE',
  //     time: '*/5 * * * * *', // every 5 seconds
  //     url: 'https://www.google.com/?q=/cron/test', // config.portfolio.processTodayEveryOneNetIncomeDataSaveURL,
  //     headersObj: {},
  // },

  {
    name: 'cardAdmin.uptimeCheck',
    time: '0 */30 * * * *', // Every 30 min
    url: `${config.cardAdminURL}`,
    headers: cardAdminURLHeadersObj,
    slack: true
  },
  {
    name: 'cardPlusWeb.uptimeCheck',
    time: '0 */30 * * * *', // Every 30 min
    url: `${config.cardPlusWebURL}`,
    headers: cardPlusWebHeadersObj,
    slack: true
  },

  {
    name: 'vPlus.uptimeCheck', // 製作 多空比介紹
    time: '0 */30 * * * *', // Every 30 min
    url: `${config.cardPlusWebURL}`,
    headers: cardPlusWebHeadersObj,
    slack: true
  }
];

/**
 * Schedules all jobs in the jobs array.
 */
let scheduleJobs = async () => {
  try {
    await verifyBaseURLs();
  } catch (err) {
    Log.error(`verifyBaseURLs: ${err}`);
    await notifyDevTeam.postToSlack('verifyBaseURLs: error', err);
  }
  try {
    await verifyCronJobs();
  } catch (err) {
    Log.error(`verifyCronJobs: ${err}`);
    await notifyDevTeam.postToSlack('verifyCronJobs: error', err);
  }

  for (let job of jobs) {
    // Log.info(`job:${job}`);
    if (job.environments && job.environments.includes(process.env.NODE_ENV) === false) {
        continue; // if this envrionment not in list of available environments, skip scheduling job
    }
    if (job && job.name && job.time && job.url) {
      // make sure job exists
      scheduleJob(job);
    } else {
      Log.error(`Problem with Job!!! ${job.name}  Check jobs list.`);
      await notifyDevTeam.postToSlack('Problem with Job!!! Check jobs list.', '');
    }
  }
};

/**
 * Schedule input job Object using cron system.
 * @param {*} job
 */
let scheduleJob = async job => {
  let options = {
    tz: DEFAULT_TZ
  };

  let thisJob = await nodeSchedule.scheduleJob(
    {
      rule: job.time,
      tz: job.tz ? job.tz : DEFAULT_TZ
    },
    async () => {
      Log.info(`Running JOB: ${job.name}...`);
      try {
        let body = await getURL(job.headers, job.url);
        if (job.slack === false) {
          return 0; // Don't notify slack.
        }
        Log.info(`JOB ${job.name} completed`);
        await notifyDevTeam.postToSlackCron(`${job.name}: OK`, body);
      } catch (err) {
        Log.error(`${job.name}: error: ${err}`);
        await notifyDevTeam.postToSlack(`${job.name}: ERROR`, err);
      }
    }
  );

  if (job.slack === false) {
    return 0; // Don't notify slack.
  }

  Log.info(` (${job.time}) JOB ${job.name} will next run at: ${thisJob.nextInvocation()}`);
  await notifyDevTeam.postToSlackCron(
    `${job.name}: SCHEDULED`,
    `\`\`\`${job.time} \`\`\` Next: *${thisJob.nextInvocation()}* \`\`\`${job.url} \`\`\` \`\`\`${
      job.name
    } \`\`\` `
  );
};

/**
 * Go to this url and verify get 200 back.
 * @param {*} headersObj - headers to send
 * @param {*} url - url to go to
 */
let getURL = (headersObj, url) => {
  return new Promise(async (resolve, reject) => {
    Log.info(`Getting URL ${url}`);
    await Request(
      {
        uri: url,
        method: 'GET',
        encoding: null,
        headers: headersObj
        // qs: bodyObj,
      },
      (error, response, body) => {
        if (!error && response.statusCode === 200) {
          Log.info(`URL ${url} OK`);
          resolve(body);
        } else {
          let statusCode = null;
          if (response) {
            statusCode = response.statusCode;
          }

          Log.error(`GET URL ${url} HTTP: ${statusCode}, error: ${error}`);
          reject(`GET URL ${url} HTTP: ${statusCode}, error: ${error}`);
          // Log.error(`getURL: ${error}`);
          // reject(error);
        }
      }
    );
  });
};

/**
 * verifyBaseURLs.
 */
let verifyBaseURLs = async () => {
  return new Promise(async (resolve, reject) => {
    let baseURLs = [
      {
        name: 'cardPlusWebURL',
        url: config.cardPlusWebURL
      },
      {
        name: 'cardAdminURL',
        url: config.cardAdminURL
      },

      {
        name: 'vPlusURL',
        url: config.vPlusURL
      }
    ];

    let OKCount = 0;
    let BADCount = 0;
    // testing baseURL
    for (let baseURL of baseURLs) {
      if (BADCount) {
        console.log(`BADCount: ${BADCount}`);
        reject('UGH');
      }
      Log.info(`verifyBaseURLs: TESTING BASE URL ${baseURL.name}:  ${baseURL.url}`);
      await Request(
        {
          uri: baseURL.url,
          method: 'GET',
          encoding: null,
          timeout: 10000 // 10 sec timeout
        },
        (error, response, body) => {
          if ((error == undefined || error == null || !error) && response.statusCode <= 302) {
            Log.info(`BASE URL ${baseURL.name} ${baseURL.url} OK`);
            OKCount++;
            if (OKCount === baseURLs.length) {
              Log.info('verifyBaseURLs OK');
              resolve('OK');
              return 0;
            }
          } else {
            let statusCode = null;
            if (response) {
              statusCode = response.statusCode;
            }
            Log.error(`BASE URL ${baseURL.name} HTTP: ${statusCode}, error: ${error}`);
            reject(`BASE URL ${baseURL.name} HTTP: ${statusCode}, error: ${error}`);
            return 0;
          }
        }
      );
    }
  });
};

/**
 * verifyCronJobs
 */
let verifyCronJobs = async () => {
  return new Promise(async (resolve, reject) => {
    Log.info(`start verifyCronJobs`);

    // testing  Job   remove headersObj call endpoint
    jobs.map(async job => {
      // Log.info(`job:${job}`);
      if (job.environments && job.environments.includes(process.env.NODE_ENV) === false) {
        return; // if this envrionment not in list of available environments, skip scheduling job
      }
      if (job && job.name && job.time && job.url) {
        await Request(
          {
            uri: job.url,
            method: 'GET',
            encoding: null,
            timeout: 10000 // 10 sec timeout
          },
          (error, response, body) => {
            if (error) {
              
              Log.error(`verifyCronJobs ${job.name} ${job.url} ,it's Fail , error: ${error} `);
              reject(`${job.name} ${job.url} ${error.toString()}`);
              return;
            }

            if (!error && response.statusCode == 200) {
              Log.info(`verifyCronJobs ${job.name} ${job.url} OK`);
              resolve(
                `verifyCronJobs ${job.name} ${job.url} OK`
              );
            } else if (!error && response.statusCode == 404) {
              Log.error(`verifyCronJobs ${job.name} ${job.url} ,it's Fail , it's not Find `);
              reject(`verifyCronJobs ${job.name} ${job.url} it's not Find `);
            } else if (!error && (response.statusCode == 401 || response.statusCode == 500)) {
              Log.info(`verifyCronJobs ${job.name} is OK`);
              resolve(`verifyCronJobs ${job.name} ${job.url} it's OK `);
            } else {
              Log.error(
                `verifyCronJobs ${job.name} ${job.url} ,it's Fail , state = ${response.statusCode} `
              );
              reject(
                `verifyCronJobs ${job.name} ${job.url} ,it's Fail , state = ${response.statusCode}`
              );
            }
          }
        );
      }
    });
    Log.info(`end verifyCronJobs`);
  });
};

// Schedule all jobs in the jobs array
scheduleJobs();

// 加入 Handler  Promise REJECT LOG
// 需要 npm install bluebird
process.on('unhandledRejection', error => {
  console.error(new Date().toString());
  console.error('-----------------');
  console.error('----Promise REJECT LOG----');
  console.error(error);

  // process.exit();  // 關閉NODEJS   // 擋掉後出錯就不會自動關閉SERVER
  // throw error;
});

// 加入 Handler  System Carsh LOG
process.on('uncaughtException', error => {
  console.error(new Date().toString());
  console.error('-----------------');
  console.error('----uncaughtException----');
  console.error(new Date().toString());
  // process.exit();  // 關閉NODEJS   // 擋掉後出錯就不會自動關閉SERVER

  throw error;
});

// notify when app dies
process.on('SIGTERM', async () => {
  Log.info('PROCESS STOP --- SIGTERM');
  await notifyDevTeam.postToSlackCron('!!! PROCESS STOP', 'SIGTERM');
  process.exit(0);
});

process.on('SIGINT', async () => {
  Log.info('PROCESS STOP --- SIGINT');
  await notifyDevTeam.postToSlackCron('!!! PROCESS STOP', 'SIGINT');
  process.exit(0);
});
