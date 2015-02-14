(function () {
	// The constructor function.
	var constructor = function (login, password, host) {
		var self = this;

		self._host = host == null ? 'http://192.168.1.1' : host;
		self._initHttpClient(login, password);
		self._initControl();
		//Статус того, что контрол готов обрабатывать события переключения.
		self._ready = false;
		//Состояние самого контрола.
		self._checked = false;
	};
	// The set of instance members.
	var instanceMembers = {};
	// The set of static members.
	var staticMembers = {};

	//Переключалка, доступен ли контрол
	//и готов ли он реагировать на дерганье слайдера.
	instanceMembers._setReady = function (value) {
		var self = this;

		self._ready = value;
		//Меняем контрол, если изменилось значение.
		self._control.disabled = !self._ready;
	};

	//Устанавливает состояние самого слайдера.
	instanceMembers._setChecked = function (value) {
		var self = this;

		self._checked = value;
		//Меняем контрол, если изменилось значение.
		self._control.checked = self._checked;
	};

	//Создание httpClient.
	var initHttpClient = function (login, password) {
		var self = this;
		//Дефолтные значения логина/пароля.
		if (login == null) {
			login = 'ringill1';
			password = '#Qwer12347';
		}
		//Добавляем соответствующий хидер.
		var authHeader = 'Basic ' + btoa(login + ':' + password);
		//Создаем httpClient.
		var httpClient = new Windows.Web.Http.HttpClient();
		//Добавляем необходимые хидеры.
		var headers = httpClient.defaultRequestHeaders;
		headers.append('Authorization', authHeader);

		//Присваеваем httpClient нашему экземпляру.
		self._httpClient = httpClient;
	};
	//Присваиваем функцию нашему экземпляру.
	instanceMembers._initHttpClient = initHttpClient;

	//Функция получения данных о текущем состоянии переключателя.
	var currentStatus = function () {
		var self = this;

		var url = self._host + '/Advanced_ACL_Content.asp';

		var promise = new WinJS.Promise(function (completeDispatch, errorDispatch, progressDispatch) {
			var httpPromise = self._httpClient.getAsync(new Windows.Foundation.Uri(url), Windows.Web.Http.HttpCompletionOption.responseContentRead);
			httpPromise.then(function (response) {
				MSApp.execUnsafeLocalFunction(function () {
					var domString = response.content.toString();
					var doc = document.implementation.createHTMLDocument("example");
					doc.documentElement.innerHTML = domString;
					var docElement = doc.getElementsByName('wl_macmode')[0];
					if (docElement == null) {
						self._setReady(false);
						errorDispatch('Роутер ответил невнятным бормотанием.');
						return;
					} else {

						var value = docElement.value;
						switch (value) {
							//Интернет у Дашки включен.
							case 'disabled':
								self._setChecked(true);
								break;
								//В этом случае инет есть только у Дашки.
							case 'allow':
								self._setReady(false);
								errorDispatch('Проблемка: у Дашки есть Интернет, а у нас нет :(');
								return;
								break;
								//А нету у Дарьи инета!
							case 'deny':
								self._setChecked(false);
								break;
						}

						//После того, как мы получили состояние включенности,
						//начинаем реагировать на дерганье переключателя.
						self._setReady(true);

						completeDispatch();
					}
				});
			}, function (error) {
				self._setReady(false);
				errorDispatch(error);
			}
			, function (progress) {
				progressDispatch(progress);
			});
		});

		return promise;
	}
	//Присваиваем функцию нашему экземпляру.
	instanceMembers.currentStatus = currentStatus;

	//Создание самого контрола переключения.
	var initControl = function () {
		var self = this;

		var control = document.getElementById('wifiToggle').winControl;
		self._control = control;

		//По-умолчанию контрол недоступен.
		self._setReady(false);
		//Добавляем обработчик переключателя.
		self._control.addEventListener("change", function () {
			if (self._ready) {
				self.toggleHandler();
			}
		});

		
	};
	//Присваиваем функцию нашему экземпляру.
	instanceMembers._initControl = initControl;

	//Переключаем состояние.
	//Обработка переключения.
	var toggleHandler = function () {
		var self = this;

		//Смотрим значение самого контрола.
		var checked = self._control.checked;
		
		var status;
		if (checked) {
			//При включении - разрешаем для выбранных устройств.
			//т.е. wifi включен.
			status = 'disabled';
		} else {
			//При отключении - запрещаем для выбранных устройств.
			//т.е. wifi выключен.
			status = 'deny';
		}

		//Отправляем запрос на изменение данных.
		self._change(status)
			.then(function () {
				//Отправляем запрос на сохранение данных.
				self._save()
					.then(function (response) {

					}, function (param1) {
						self._setReady(false);
						//Выбросить сообщение об ошибке.
						if (self.logObject) {
							self.logObject.log(param1.toString());
						}
					});
			}, function (param1) {
				self._setReady(false);
				//Выбросить сообщение об ошибке.
				if (self.logObject) {
					self.logObject.log(param1.toString());
				}
			});
	};
	//Присваиваем функцию нашему экземпляру.
	instanceMembers.toggleHandler = toggleHandler;

	//Кодируем параметры формы.
	var encodeUrlParams = function (data) {

		var params = [];
		for (var key in data) {
			if (data.hasOwnProperty(key)) {
				params.push(key + "=" + encodeURIComponent(data[key]));
			}
		}
		return params.join("&");

	};
	//Присваиваем функцию нашему экземпляру.
	instanceMembers._encodeUrlParams = encodeUrlParams;

	//Отправка запроса на изменение состояния.
	var change = function (status) {
		var self = this;

		var formObject = {
			'current_page': 'Advanced_ACL_Content.asp',
			'next_page': 'Advanced_WSecurity_Content.asp',
			'next_host': '192.168.1.1',
			'sid_list': 'DeviceSecurity11a;',
			'group_id': '',
			'modified': '0',
			'action_mode': ' Apply ',
			'first_time': '',
			'action_script': '',
			'wl_macmode': status,
			'wl_macnum_x_0': '3\r\n',
			'wl_maclist_x_0': '',
			'wl_macdesc_x_0': '',
			'action': ' Apply '
		};

		var url = self._host + '/apply.cgi';
		var encodedQuery = self._encodeUrlParams(formObject);
		var uri = new Windows.Foundation.Uri(url + '?' + encodedQuery);
		return self._send(uri);
	}
	//Присваиваем функцию нашему экземпляру.
	instanceMembers._change = change;

	//Отправка запроса на сохранение состояния.
	var save = function () {
		var self = this;

		var formObject = {
			'action_mode': 'Save&Restart ',
			'current_page': 'SaveRestart.asp',
			'next_page': 'Restarting.asp',
			'sid_list': 'General;',
			'group_id': '',
			'modified': '0',
			'action': 'Save&Restart'
		};

		var url = self._host + '/apply.cgi';
		var encodedQuery = self._encodeUrlParams(formObject);
		var uri = new Windows.Foundation.Uri(url + '?' + encodedQuery);
		return self._send(uri);
	};
	//Присваиваем функцию нашему экземпляру.
	instanceMembers._save = save;

	//Отправка формы.
	var send = function (uri) {
		var self = this;
		return self._httpClient.getAsync(uri, Windows.Web.Http.HttpCompletionOption.responseContentRead);
	}
	//Присваиваем функцию нашему экземпляру.
	instanceMembers._send = send;

	var WiFiElement = WinJS.Class.define(
    constructor, instanceMembers, staticMembers);

	WinJS.Namespace.define("Model", {
		WiFiElement: WiFiElement
	});
}());
