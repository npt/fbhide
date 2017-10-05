#!/bin/sh
for size in 16 19 48 128; do
    convert -geometry ${size}x${size} icon.png ext/icons/icon${size}.png
done
