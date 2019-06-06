# Scrum bot

Are you tired of:

"So who wants to speak next?"

"I do" (said by three people)

(three second pause)

"Me!" (said by two people)

(eight minutes later the next person is chosen).

This bot will take the hassle out by selecting a random order for people to scrum in.

## Usage

`/standup`

The bot will echo the order in which to scrum using mentions.

`/standup exclude @user1 @user2 @user3`

The bot will exclude the given users from future scrums. The excludes are saved in redis.

`/standup include @user1 @user3`

The bot will remove the given exclusions.

## Running

`docker compose up`

This docker-compose configuration starts a container for the bot and another for a redis instance to store the exclusions. You'll want to edit the `.env` file first to provide your slack key via `ACCESS_TOKEN`.
