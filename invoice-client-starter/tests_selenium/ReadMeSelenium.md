# Run test HEADLESS (w/o UI) 
 $env:HEADLESS="1"; npm run test:ui:selenium


# Run test HEADED (with UI)
 $env:HEADLESS="0"; npm run test:ui:selenium
