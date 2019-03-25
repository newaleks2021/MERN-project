#!/usr/local/bin/bash

SCRIPT=`realpath $0`
SCRIPTPATH=`dirname $SCRIPT`
CI_COMMIT_REF_NAME="$1"

echo "Starting deployment $SCRIPTPATH $CI_COMMIT_REF_NAME" 

cd $SCRIPTPATH 

git fetch || exit 1
git checkout -f develop || exit 2
git pull origin develop || exit 3

npm install || exit 4
npm run migrate || exit 5
npm run webpack-once || exit 6

echo "Finished deployment $SCRIPTPATH $CI_COMMIT_REF_NAME" 
