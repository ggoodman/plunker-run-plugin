module.exports = {
    analytics: {
        id: 'UA-12345678-0',
    },
    services: {
        run: {
            'public': {
                host: 'run.plnkr.co',
            },
            'local': {
                port: process.env.PORT,
            },
        },
    },
    shared: {
        url: {
            api: 'http://api.plnkr.co',
            run: 'http://run.plnkr.co',
        },
    },
    webtask: {
        token: 'ey...',
        url: 'https://webtask.it.auth0.com',
    }
};