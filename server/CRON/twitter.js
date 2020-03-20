const Twitter = require("twitter");
const { TweetDAO } = require("../api/tweet/dao");

const maxTweets = 2000;
const tweetsPerQuery = 100;

const splitString = (value, index) => {
  return [value.substring(0, index), value.substring(index)];
};

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

let tweetCount = 0;

const options = {
  q: "#MesDeLamemoria OR #24DeMarzo OR #ConstruimosMemoria OR #PañuelosConMemoria -filter:retweets -filter:replies filter:images",
  tweet_mode: "extended",
  count: tweetsPerQuery,
  include_entities: true
};

const getTweets = maxId => {
  if (maxId) {
    const maxIdLength = maxId.length;
    const [start, end] = splitString(maxId, maxIdLength - 4);
    const endInt = parseInt(end) - 1;
    options.max_id = `${start}${endInt}`;
    console.log(`Fetching from ${options.max_id}`);
  }

  client.get("search/tweets", options, function(error, tweets, response) {
    if (error) {
      console.log(`Processed ${tweetCount}. And got the error below.`);
      console.error(error);
      return;
    }
    if (tweets.statuses.length === 0) {
      console.log(`No more tweets. Totals ${tweetCount}.`);
      return;
    }
    if (tweetCount >= maxTweets) {
      console.log(`Hit maxTweets soft limit. Totals ${tweetCount}.`);
      return;
    }

    const { statuses } = tweets;
    const myArrayOfTweets = [];
    statuses.forEach(function(tweet) {
      if (
        tweet.entities &&
        tweet.entities.media &&
        tweet.entities.media.length > 0
      ) {
        const myUsefulTweet = {
          tweet_created_at: tweet.created_at,
          tweet_id_str: tweet.id_str,
          full_text: tweet.full_text,
          hashtags: [],
          media: [],
          user: {
            name: tweet.user.name,
            screen_name: tweet.user.screen_name,
            location: tweet.user.location,
            profile_image_url: tweet.user.profile_image_url,
            profile_image_url_https: tweet.user.profile_image_url_https
          },
          geo: tweet.geo,
          coordinates: tweet.coordinates
        };
        tweet.entities.media.forEach(function(m) {
          const [baseUrl, format] = m.media_url_https.split(/\.(?=[^\.]+$)/);
          myUsefulTweet.media.push({
            media_url: m.media_url,
            media_url_https: m.media_url_https,
            media_url_thumb: `${baseUrl}?format=${format}&name=thumb`,
            media_url_small: `${baseUrl}?format=${format}&name=small`,
            media_url_medium: `${baseUrl}?format=${format}&name=medium`,
            media_url_large: `${baseUrl}?format=${format}&name=large`
          });
        });
        if (
          tweet.entities &&
          tweet.entities.hashtags &&
          tweet.entities.hashtags.length > 0
        ) {
          tweet.entities.hashtags.forEach(function(h) {
            myUsefulTweet.hashtags.push(h.text);
          });
        }
        myArrayOfTweets.push(myUsefulTweet);
        tweetCount++;
      }
    });

    TweetDAO.insertMany(myArrayOfTweets)
      .then(tweetResults => {
        console.log(`Success! Inserted ${tweetResults.insertedCount}`);
        getTweets(statuses[statuses.length - 1].id_str);
      })
      .catch(err => {
        console.log("Something failed at saving many");
        console.error(err);
      });
  });
};

module.exports = { getTweets };