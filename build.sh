cp -r graded-enja-corpus/dist/* src/data
mkdir -p docs
cp -r src/* docs
drop-inline-css -r src -o docs
minify -r docs -o docs
