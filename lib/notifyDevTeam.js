// TODO: Set URLs for slack, or refactor to use MS teams

// 活動 一次性工具
const request = require('request');
const logger = require('../lib/logger');


let MachineName = '';
let PostSlack = '';
let PostSlackCron = '';

if (process.env.NODE_ENV === 'production') {
    MachineName = 'PRODUCTION - SCHEDULER';
    PostSlack = 'slack url for sending alerts to dev team - error level';
    PostSlackCron = 'slack url for sending alerts for cron - info level';
} else if (process.env.NODE_ENV === 'staging') {
    MachineName = 'STAGING - SCHEDULER';
    PostSlack = 'slack url for sending alerts to dev team - error level';
    PostSlackCron = 'slack url for sending alerts for cron - info level';
} else {
    MachineName = 'LOCAL/DEV - SCHEDULER';
    PostSlack = 'slack url for sending alerts to dev team - error level';
    PostSlackCron = 'slack url for sending alerts for cron - info level';
}

//  發送到 slack
const postToSlackCron = async (type, eventStr) => {
    return new Promise((resolve, reject) => {
        const attachments = {
            attachments: [
                {
                    color: '#36a64f',
                    title: type,
                },
                {
                    fields: [
                        {
                            title: '來源機器',
                            value: MachineName,
                        },
                        {
                            title: 'CRON訊息',
                            value: eventStr.toString(),
                        },
                    ],
                },
            ],
        };

        request.post(
            {
                url: PostSlackCron,
                body: JSON.stringify(attachments),
            },
            (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    logger.info(new Date().toString());
                    logger.info('postToSlackCron');
                    resolve('postToSlackCron');
                } else {
                    logger.error(error);
                    resolve(error);
                }
            },
        );
    });
};

//  發送到 slack
const postToSlack = async (type, eventStr) => {
    return new Promise((resolve, reject) => {
        const attachments = {
            attachments: [
                {
                    color: '#36a64f',
                    title: type,
                },
                {
                    fields: [
                        {
                            title: '來源機器',
                            value: MachineName,
                        },
                        {
                            title: '錯誤訊息',
                            value: eventStr.toString(),
                        },
                    ],
                },
            ],
        };

        request.post(
            {
                url: PostSlack,
                body: JSON.stringify(attachments),
            },
            (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    logger.info(new Date().toString());
                    logger.info('postToSlack');
                    resolve('postToSlack');
                } else {
                    logger.error(error);
                    resolve(error);
                }
            },
        );
    });
};

module.exports = {
    postToSlack,
    postToSlackCron,
};
