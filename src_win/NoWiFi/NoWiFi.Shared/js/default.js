// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=392286
(function () {
	"use strict";

	var app = WinJS.Application;
	var activation = Windows.ApplicationModel.Activation;

	app.onactivated = function (args) {
		if (args.detail.kind === activation.ActivationKind.launch) {
			var promise = WinJS.UI.processAll();

			if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
				// TODO: This application has been newly launched. Initialize
				promise.then(function () {
					//Объект для вывода popup-сообщений.
					var logObject = {
						log: function (message) {
							var messagedialogpopup = new Windows.UI.Popups.MessageDialog(message, 'Ошибочка');
							messagedialogpopup.showAsync();
						}
					};

					//Создаем наш god-object.
					var wifiElement = new Model.WiFiElement();
					//Объект вывода сообщений.
					wifiElement.logObject = logObject;
					
					//Выясняем статус (включен интернет или нет).
					//После того как статус будет выяснен - прицепится обработчик события переключения.
					var wifiPromise = wifiElement.currentStatus();
					wifiPromise.then(function () { },
						function (param1) {
						logObject.log(param1.toString());
					});
				});
			} else {
				// TODO: This application has been reactivated from suspension.
				// Restore application state here.
			}


			args.setPromise(promise);
		}
	};

	app.oncheckpoint = function (args) {
		// TODO: This application is about to be suspended. Save any state
		// that needs to persist across suspensions here. You might use the
		// WinJS.Application.sessionState object, which is automatically
		// saved and restored across suspension. If you need to complete an
		// asynchronous operation before your application is suspended, call
		// args.setPromise().
	};

	app.start();
})();