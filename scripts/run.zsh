#!/bin/zsh

if [ x$1 = xprod ] ; then
  shift
  docker-compose -f docker-compose.yml up $*
else
  docker-compose up
fi
