# Timer

This is a simple HTML/CSS/JS timer applet. I made it for someone discovered that other timers went idle if she left them running long enough and ended up not ringing when they finished. This one's approach is to record when the timer was started and continually compare the current time to the time it should finish it, rather than simply setting a literal `timeout` when the timer is started. This means that even if execution is dropped or paused in the background, when resumed, it will automatically recover any difference.

As a side benefit, this also means it's easy to keep track of the timer being paused and how long it's been paused for. This was of particular interest since the primary application was for keeping track of hours when working from home. Thus, it could be paused for quick runs for tea or washroom breaks or what have you without having to keep noting start and stop times. The total paused time could just be subtracted from the total worked time. 

## TODO

* Add a visual timer option.
* Allow an export of hours worked in CSV format.
