for i in {0..73} ; do
  convert -resize 300x300 -quality 100 _images/cat${i}.png src/img/cat${i}.png
  cwebp src/img/cat${i}.png -o src/img/cat${i}.webp
  rm src/img/cat${i}.png
done
