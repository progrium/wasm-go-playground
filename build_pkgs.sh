#!/bin/sh
DIR="$(cd "$(dirname "$0")" && pwd)"
output=$(GOOS=js GOARCH=wasm go install -work -a $1 2>&1)
work_dir=$(echo "$output" | awk -F'=' '/WORK=/ {print $2}')
cat $work_dir/*/importcfg | grep packagefile | sort | uniq | cut -c 13- | while IFS="=" read -r name path; do
  mkdir -p $(dirname "$DIR/pkg/$name")
  cp $path $DIR/pkg/$name.a
done
cp $work_dir/b001/_pkg_.a $DIR/pkg/$1.a