class App {
  stage;
  jukebox;
  timer;
  hourglass;
  btnStart;
  btnReset;
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

    this.stage = new Stage();
    this.stage.createScenes([
      {name: 'timer', panelSelector: '#timerScene'},
      {name: 'alarm', panelSelector: '#alarmScene'},
    ]);
    this.stage.setDefault("timer");
    this.stage.show('timer');

    this.jukebox = new Jukebox();
    this.preloadJukebox();

    this.options = new Options();
    this.timer = new Timer();

    this.options.initialize();
    this.timer.reset();

    this.drawTimer();
    this.disableReset(true);

    this.ringing = false;
    this.overtime = false;
    this.ringInterval = null;
  }
  
  preloadJukebox() {
    this.jukebox.addByURL('cathedral', 'https://t.sawczak.com/common/assets/sounds/cathedral.mp3');
    this.jukebox.addByURL('pipe', 'https://t.sawczak.com/common/assets/sounds/smb_pipe.mp3');
    this.jukebox.addByURL('pause', 'https://t.sawczak.com/common/assets/sounds/smb_pause.mp3');
    this.jukebox.addByURL('kick', 'https://t.sawczak.com/common/assets/sounds/smb_kick.mp3');
  }

  gatherElements() {
    this.hourglass = $("#hourglass");
    this.btnStart = $("#btnStart");
    this.btnReset = $("#btnReset");
    this.btnAlarm = $("#btnAlarm");

    this.hoursDisplay = $(".hoursDisplay");
    this.minutesDisplay = $(".minutesDisplay");
    this.secondsDisplay = $(".secondsDisplay");

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

    this.btnAlarm.click((e) => {
      if (! this.ringing) {
        return;
      }
      this.stopRinging();
    });

    $(document).keyup((e) => {
      if (e.keyCode === 32) {
        
        if (this.ringing) {
          this.btnAlarm.click();
        } else {
          this.btnStart.click();  
        }        
        
      } else if (e.keyCode === 82) { // r
        if (this.ringing) {
          this.btnAlarm.click();          
        }
        this.btnReset.click();    
      }
    });
  }

  timerEnd() {
    this.startRinging();
    this.stage.show('alarm');
    this.disableAlarmButton(false);

    this.disableStart(true);
    this.overtime = true;
  }

  reset() {
    this.stopRinging();
    this.disableAlarmButton(true);

    this.endHourglass();
    this.timer.reset();

    this.drawTimer();

    this.disableReset(true);
    this.disableStart(false);
    this.overtime = false;

    this.jukebox.play("kick");
    this.updateWindowTitle();
  }

  startRinging() {
    if (!this.ringing) {
      this.ringing = true;
      this.jukebox.play("cathedral");
      // $(".timerPanel").addClass("overlay");
      this.ringInterval = setInterval(() => {
        this.jukebox.play("cathedral");
      }, 28 * 1000);
    }
  }

  stopRinging() {
    if (this.ringing) {
      this.ringing = false;
      clearInterval(this.ringInterval);
      this.jukebox.stop("cathedral");
      this.stage.show('timer');
      this.timer.reset();

      // $("#timerPanel").removeClass("overlay");
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
  }

  drawCounters() {
    const prettyValues = this.timer.prettyValues();
    this.hoursDisplay.html(prettyValues.hours);
    this.minutesDisplay.html(prettyValues.minutes);
    this.secondsDisplay.html(prettyValues.seconds);

    let tp = $(".timerPanel");
    let ns = $('.negativeSign');

    tp.removeClass("overtime-1");
    tp.removeClass("overtime-2");
    tp.removeClass("overtime-3");
    tp.removeClass("overtime-4");
    ns.addClass("hide");

    if (prettyValues.overtimeLevel > 0) {
      tp.addClass(`overtime-${prettyValues.overtimeLevel}`);
    }

    if (prettyValues.overtimeLevel > 1) {
      ns.removeClass("hide");
    }
  }

  drawButtons() {
    this.btnStart
      .html(
        this.timer.paused ? FontAwesome.fa("play") : FontAwesome.fa("pause")
      );
    this.btnReset.html(FontAwesome.fa("trash"));
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

  disableAlarmButton(flag) {
    this.btnAlarm.prop("disabled", flag);
  }

  rotateHourglass(degrees) {
    DOMTools.rotate(this.hourglass, degrees);
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
      0 === (this.nHours.value() + this.nMinutes.value() + this.nSeconds.value());
    app.disableStart(flag);
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
    this.initialize();
  }

  initialize() {
    this.stopInterval();

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

  reset() {
    this.initialize();
    this.readOptions();
  }

  readOptions() {
    this.maxHours = app.options.nHours.value();
    this.maxMinutes = app.options.nMinutes.value();
    this.maxSeconds = app.options.nSeconds.value();
  }

  secondsLimit() {
    return (this.maxHours * 3600) + (this.maxMinutes * 60) + this.maxSeconds;
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
    return (timeLeft.hours * 3600) + (timeLeft.minutes * 60) + (timeLeft.seconds);
  }

  click() {
    let secondsLeft = Math.round(this.secondsLeft());

    if (Math.round(secondsLeft) === 0) {
      this.end();
    }

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
    }, 50);
  }

  stopInterval() {
    clearInterval(this.interval);
    this.interval = null;
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
