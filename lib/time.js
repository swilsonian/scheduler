const tsFormat = () => {
    let date = new Date();
    let isoDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();

    return `${isoDate}`;
};

module.exports = {
    tsFormat,
};
