#!/bin/zsh

rootdir=$(dirname $0)/..
source $rootdir/.env
docker-compose exec redis redis-cli -a $REDIS_PASSWORD $*
