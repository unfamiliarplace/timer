class App {
  jukebox;
  timer;
  hourglass;
  btnStart;
  btnReset;
  btnClear;
  btnAlarm;
  hoursDisplay;
  minutesDisplay;
  secondsDisplay;
  ringing;
  ringInterval;
  overtime;

  initialize() {
    this.gatherElements();
    this.bindElements();

    this.jukebox = new Jukebox();
    this.options = new Options();
    this.timer = new Timer();

    this.addSounds();
    this.options.initialize();
    this.timer.initialize();
    this.drawTimer();
    this.disableReset(true);

    this.ringing = false;
    this.overtime = false;
    this.ringInterval = null;
  }

  gatherElements() {
    this.hourglass = $("#hourglass");
    this.btnStart = $("#btnStart");
    this.btnReset = $("#btnReset");
    // this.btnClear = $("#btnClear");
    this.btnAlarm = $("#btnAlarm");

    this.hoursDisplay = $("#hoursDisplay");
    this.minutesDisplay = $("#minutesDisplay");
    this.secondsDisplay = $("#secondsDisplay");

    this.startedDisplay = $("#startedDisplay");
    this.pausedDisplay = $("#pausedDisplay");
    this.finishesDisplay = $("#finishesDisplay");
  }

  bindElements() {
    this.btnStart.click((e) => {
      if (this.btnStart.prop("disabled")) {
        return;
      }
      this.start();
    });

    this.btnReset.click((e) => {
      if (this.btnReset.prop("disabled")) {
        return;
      }
      this.reset();
    });

    //this.btnClear.click((e) => {
    //  this.clear();
    //});

    this.btnAlarm.click((e) => {
      if (! this.ringing) {
        return;
      }
      this.stopRinging();
      this.endHourglass();
    });

    $(document).keyup((e) => {
      if (e.keyCode == 32) {
        
        if (this.ringing) {
          this.btnAlarm.click();
        } else {
          this.btnStart.click();  
        }        
        
      } else if (e.keyCode == 82) { // r
        if (this.ringing) {
          this.btnAlarm.click();          
        }
        this.btnReset.click();    
      }
    });
  }

  clear() {
    this.jukebox.play("shake");
    this.options.resetValues();
    this.timer.reset();
    this.drawTimer();
    this.disableReset(true);
    this.disableClear(true);
    this.disableStart(true);
    this.overtime = false;
  }

  reset() {
    
    this.stopRinging();
    this.endHourglass();
    
    this.jukebox.play("kick");
    this.timer.reset();
    this.drawTimer();
    this.disableReset(true);
    app.disableStart(false);
    app.disableClear(false);
    $("#timerPanel").removeClass("overlay");
    this.overtime = false;
    this.updateWindowTitle();
  }

  startRinging() {
    if (!this.ringing) {
      this.ringing = true;
      this.jukebox.play("cathedral");
      $("#timerPanel").addClass("overlay");
      this.ringInterval = setInterval(() => {
        this.jukebox.play("cathedral");
      }, 28 * 1000);
    }
  }

  stopRinging() {
    if (this.ringing) {
      this.ringing = false;
      clearInterval(this.ringInterval);
      this.timer.stopInterval();
      this.jukebox.stop("cathedral");
      this.drawTimer();
      this.disableAlarmButton(true);
      $("#timerPanel").removeClass("overlay");
    }
  }

  start() {
    if (!this.timer.started) {
      this.jukebox.play("pipe");
      this.timer.start();
    } else {
      if (this.timer.paused) {
        this.jukebox.play("pipe");
        this.timer.unpause();
      } else {
        this.jukebox.play("pause");
        this.timer.pause();
      }
    }

    this.drawTimer();
    this.disableReset(false);
    app.disableClear(false);
  }

  addSounds() {
    this.jukebox.add("cathedral", "#soundCathedral");
    this.jukebox.add("bell", "#soundBell");
    this.jukebox.add("shake", "#soundShake");
    this.jukebox.add("coin", "#soundCoin");
    this.jukebox.add("speedup", "#soundSpeedup");
    this.jukebox.add("pipe", "#soundPipe");
    this.jukebox.add("jump", "#soundJump");
    this.jukebox.add("leap", "#soundLeap");
    this.jukebox.add("stomp", "#soundStomp");
    this.jukebox.add("pause", "#soundPause");
    this.jukebox.add("die", "#soundDie");
    this.jukebox.add("kick", "#soundKick");
    this.jukebox.add("powerup", "#soundPowerup");
    this.jukebox.add("5seconds", "#sound5Seconds");
    this.jukebox.add("worldclear", "#soundWorldClearExcerpt");
  }

  drawCounters() {
    const prettyValues = this.timer.prettyValues();
    this.hoursDisplay.html(prettyValues.hours);
    this.minutesDisplay.html(prettyValues.minutes);
    this.secondsDisplay.html(prettyValues.seconds);

    $("#timerPanel").removeClass("overtime-1");
    $("#timerPanel").removeClass("overtime-2");
    $("#timerPanel").removeClass("overtime-3");
    $("#timerPanel").removeClass("overtime-4");
    $("#timerPanel").removeClass("negative");

    if (prettyValues.overtimeLevel > 0) {
      $("#timerPanel").addClass(`overtime-${prettyValues.overtimeLevel}`);
    }

    if (prettyValues.overtimeLevel > 1) {
      $("#timerPanel").addClass("negative");
    }
  }

  drawButtons() {
    this.btnStart
      .find(".buttonEmoji")
      .html(
        this.timer.paused ? FontAwesome.fa("play") : FontAwesome.fa("pause")
      );
    this.btnReset.find(".buttonEmoji").html(FontAwesome.fa("trash"));
    if (this.timer.paused) {
      this.btnStart.prop("title", "Start timer (hotkey space)");
    } else {
      this.btnStart.prop("title", "Pause timer (hotkey space)");
    }
  }

  drawHourglass() {
    if (this.timer.paused) {
      if (this.timer.started) {
        this.pauseHourglass();
      } else {
        this.resetHourglass();
      }
    } else {
      if (this.timer.ended) {
        this.endHourglass();
      } else {
        this.startHourglass();
      }
    }
  }

  drawReport() {
    if (!this.timer.started) {
      this.startedDisplay.html("—");
      this.finishesDisplay.html("—");
      this.pausedDisplay.html("—");
    } else {
      const started = this.timer.dtStarted;
      const finishes = this.timer.finishes();
      const timePaused = this.formatTime(this.timer.displaySecondsPaused());
      this.startedDisplay.html(started.toFormat("h:mm:ss a"));
      this.finishesDisplay.html(finishes.toFormat("h:mm:ss a"));
      this.pausedDisplay.html(timePaused);
    }
  }

  updateWindowTitle() {
    let timerText = "";
    const title = $("head title");

    if (!(this.overtime || this.timer.started)) {
      title.html("Timer");
      return;
    } else {
      const prettyValues = this.timer.prettyValues();
      let time = `${prettyValues.hours}:${prettyValues.minutes}:${prettyValues.seconds}`;
      if (prettyValues.overtimeLevel > 1) {
        time = "-" + time;
      }

      if (this.overtime) {
        timerText = `⏰ Time's up! ${time}`;
      } else if (this.timer.started) {
        if (this.timer.paused) {
          timerText = `⏸ ${time}`;
        } else {
          timerText = `▶ ${time}`;
        }
      }

      let title = $("head title");
      title.html(timerText);
    }
  }

  drawTimer() {
    this.drawCounters();
    this.drawButtons();
    this.drawHourglass();
    this.drawReport();
    this.updateWindowTitle();
  }

  formatTime(seconds) {
    let hours = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    seconds = seconds % 3600;
    let minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    seconds = (seconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  disableStart(flag) {
    this.btnStart.prop("disabled", flag);
  }

  disableReset(flag) {
    this.btnReset.prop("disabled", flag);
  }

  disableClear(flag) {
    //this.btnClear.prop("disabled", flag);
  }

  disableAlarmButton(flag) {
    this.btnAlarm.prop("disabled", flag);

    if (flag) {
      this.btnAlarm.addClass("hidden");
    } else {
      this.btnAlarm.removeClass("hidden");
    }
  }

  rotateHourglass(degrees) {
    Tools.rotate(this.hourglass, degrees);
  }

  resetHourglass() {
    this.hourglass.html(FontAwesome.fa("hourglass"));
    this.rotateHourglass(0);
  }

  startHourglass() {
    this.hourglass.html(FontAwesome.fa("hourglass-end"));
    this.rotateHourglass(180);
  }

  pauseHourglass() {
    this.hourglass.html(FontAwesome.fa("hourglass-half"));
    this.rotateHourglass(270);
  }

  endHourglass() {
    this.hourglass.html(FontAwesome.fa("hourglass-end"));
    this.rotateHourglass(360);
  }

  timerHalfway() {
    this.jukebox.play("worldclear");
  }

  timerLastStretch() {
    this.jukebox.play("powerup");
  }

  timerEnd() {
    this.startRinging();
    this.disableAlarmButton(false);
    this.disableStart(true);
    this.overtime = true;
  }
}

class Options {
  /** @type {OptionSpinner} */ nHours;
  /** @type {OptionSpinner} */ nMinutes;
  /** @type {OptionSpinner} */ nSeconds;
  /** @type array */ changers;

  initialize() {
    this.gatherElements();
    this.setElements();
    this.bindElements();
  }

  gatherElements() {
    this.nHours = new OptionSpinner($("#nHours"));
    this.nMinutes = new OptionSpinner($("#nMinutes"));
    this.nSeconds = new OptionSpinner($("#nSeconds"));
    this.changers = [this.nHours, this.nMinutes, this.nSeconds];
  }

  setElements() {
    this.nHours.value(0);

    this.nMinutes.value(25);

    this.nSeconds.value(0);

    for (let changer of this.changers) {
      changer.min(0);
    }
  }

  bindElements() {
    for (let changer of this.changers) {
      changer.on('input keyup change', e => {
        app.timer.reset();
        app.drawTimer();
        app.disableReset(true);
        this.checkDisableStartAndClear();
      });
    }
  }

  checkDisableStartAndClear() {
    const flag =
      0 === this.nHours.value() + this.nMinutes.value() + this.nSeconds.value();
    app.disableStart(flag);
    app.disableClear(flag);
  }

  resetValues() {
    this.nHours.value(0);
    this.nMinutes.value(0);
    this.nSeconds.value(0);
  }
}

class Timer {
  /** @type int */ maxHours;
  /** @type int */ maxMinutes;
  /** @type int */ maxSeconds;

  /** @type boolean */ paused;
  /** @type boolean */ started;
  /** @type boolean */ ended;

  /** @type int */ interval;

  /** @type DateTime */ dtStarted;
  /** @type DateTime */ dtPaused;
  /** @type int */ secondsPreviouslyPaused;

  constructor() {
    this.interval = null;

    this.maxHours = 0;
    this.maxMinutes = 0;
    this.maxSeconds = 0;

    this.paused = true;
    this.started = false;
    this.ended = false;

    this.dtStarted = null;
    this.dtPaused = null;
    this.secondsPreviouslyPaused = 0;
  }

  initialize() {
    this.reset();
  }

  reset() {
    this.stopInterval();

    this.maxHours = app.options.nHours.value();
    this.maxMinutes = app.options.nMinutes.value();
    this.maxSeconds = app.options.nSeconds.value();

    this.started = false;
    this.paused = true;
    this.ended = false;

    this.dtStarted = null;
    this.dtPaused = null;
    this.secondsPreviouslyPaused = 0;
  }

  secondsLimit() {
    return this.maxHours * 3600 + this.maxMinutes * 60 + this.maxSeconds;
  }

  secondsCurrentlyPaused() {
    if (!this.paused) {
      return 0;
    }

    return luxon.DateTime.now().diff(this.dtPaused, "seconds").seconds;
  }

  totalSecondsPaused() {
    return this.secondsPreviouslyPaused + this.secondsCurrentlyPaused();
  }

  timeLeft() {
    if (!this.started) {
      return this.secondsLimit();
    }

    const started = this.dtStarted;
    const duration = luxon.Duration.fromObject({
      seconds: this.secondsLimit() + this.totalSecondsPaused()
    });
    const dtFinished = started.plus(duration);
    return dtFinished.diffNow(["hours", "minutes", "seconds"]);
  }

  secondsLeft() {
    const timeLeft = this.timeLeft();
    return timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
  }

  elapsed() {
    return this.secondsLimit() - this.secondsLeft();
  }

  click() {
    let secondsLeft = Math.round(this.secondsLeft());

    if (Math.round(secondsLeft) === 0) {
      this.end();

      // unreliable and undesired
    } // else {
    //  if (secondsLeft === Math.round(this.secondsLimit() / 2)) {
    //    app.timerHalfway();
    //  } else if (secondsLeft === 30) {
    //    app.timerLastStretch();
    //  }
    //}

    app.drawTimer();
  }

  start() {
    this.started = true;
    this.paused = false;
    this.dtStarted = luxon.DateTime.now();
    this.startInterval();
  }

  pause() {
    this.paused = true;
    this.dtPaused = luxon.DateTime.now();
  }

  unpause() {
    this.secondsPreviouslyPaused += this.secondsCurrentlyPaused();

    this.paused = false;
    this.dtPaused = null;
  }

  end() {
    //this.stopInterval();
    this.ended = true;
    app.timerEnd();
  }

  finishes() {
    if (!this.started) {
      return null;
    }

    const started = this.dtStarted;
    const duration = luxon.Duration.fromObject({
      seconds: this.secondsLimit() + this.totalSecondsPaused()
    });
    return started.plus(duration);
  }

  startInterval() {
    this.interval = setInterval(() => {
      this.click();
    }, 250);
  }

  stopInterval() {
    clearInterval(this.interval);
  }

  prettyValues() {
    let display = {};
    display.overtimeLevel = 0;

    if (!this.started) {
      display.hours = this.maxHours.toString().padStart(2, "0");
      display.minutes = this.maxMinutes.toString().padStart(2, "0");
      display.seconds = this.maxSeconds.toString().padStart(2, "0");
    } else {
      const timeLeft = this.timeLeft();
      let seconds = Math.abs(Math.floor(timeLeft.seconds));
      let minutes = Math.abs(Math.floor(timeLeft.minutes));
      let hours = Math.abs(Math.floor(timeLeft.hours));

      if (seconds === 60) {
        seconds = 0;
        minutes += 1;
      }

      if (minutes === 60) {
        minutes = 0;
        hours += 1;
      }

      display.hours = hours.toString().padStart(2, "0");
      display.minutes = minutes.toString().padStart(2, "0");
      display.seconds = seconds.toString().padStart(2, "0");

      let secondsLeft = Math.floor(this.secondsLeft());
      if (secondsLeft < -29) {
        display.overtimeLevel = 4;
      } else if (secondsLeft < -14) {
        display.overtimeLevel = 3;
      } else if (secondsLeft < 0) {
        display.overtimeLevel = 2;
      } else if (secondsLeft < 1) {
        display.overtimeLevel = 1;
      }
    }

    return display;
  }

  displaySecondsPaused() {
    return Math.round(this.totalSecondsPaused());
  }
}

let app = null;

$(document).ready((e) => {
  app = new App();
  app.initialize();
});