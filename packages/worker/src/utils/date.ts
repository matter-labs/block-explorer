export const unixTimeToDate = (unixTime: number) => new Date(unixTime * 1000);

export const unixTimeToDateString = (unixTime: number) => new Date(unixTime * 1000).toISOString();
