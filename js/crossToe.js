//*******************************************************************
// Крестик нолик v1.0.0
// 
// Copyright 2011, ilopX
// лицензя GPL
//
// Дата: Чт 30 июня 2011 14:16:56
//
// Скрипт исопользует 
//		  ТЕХ: 	HTML, CSS, JavaScript, jQuery
//		ФАЛЙЫ: 	crossToe.css, backgroundСrossToe.png, crossToe.png
// 
// Метод использования:
// Вариант 1 (один эеземпляр):
//	1. На странице укажите <div id="имя_селектора"></div>
//	2. После загрузки страници введите var ct = new CrossToe('#имя_селектора');
// Вариант 2 (много экземпляров):
//	1. На странице укажите <div id="имя_селектора"></div> при этом можно указывать таких в множестве
//	2. После загрузки страници введите InitAllCrossToe('#имя_селектора');
	
//-------------------------------------------------------------------
// Стиль эффектов
CrossToeStyle =
{
	// const
	animatedSpeedIn:500,	// Скорость анимации при наведении мыши
	animatedSpeedOut:900,	// Скокрость анимации при отведении мыши
	alphaCell: 0.85,		// прозрачность нормального состояния
	alphaHide: 0.2,			// прозрачность подсказок		
	alphaActive: 0.70,		
	alphaActiveHover: 0.95
};
//-------------------------------------------------------------------
// Класс одного экземпляра игры крестик нолик
CrossToe = function (id)
{
	// private var
	var that = this;

	// Главнй и самый высокий по рангу селектор
	// если указано только название селектора будем искать его
	var m_mainSelector  = (typeof(id) == 'string') ? $(id) : id;

	// 9 ячеек
	var m_cell = m_mainSelector.find('#cells > div:not(.clr)');

	// селектор кнопки меню сложности
	var m_menuLevels;
	
	// Массив со значениями ячеек можно было бы обойтись 
	// и без него используя m_cell, но позно это понял, а оптимизировать
	// код ради такой мелочи нет смылса. Кстати бот работает с ним быстрее чем с m_cell
	var m_arr = [];
	
	// текущий плеер тот который играет пользователь
	var m_currentPlayer = 'X';
	var m_botPlayer = 'O';
	
	// селектор информационная панель
	var m_Information;
	
	// Состояние игры
	var m_GameSataus = 'run';
	
	// спрошена ли игра
	var m_reset = true;
	
	// установленный пользователем уровень сложности
	var m_userLevel = 2;
	
	// тип игры может быть на прохождение или просто игра или демо режим
	var m_gameType = 'NewGame';
	
	// кто первый ходит компьютер или человек
	var m_cheiHod = false;
	
	// выйгрыши компьютера
	var m_nIndexBot = 0;
	
	// выйгрыши человека
	var m_nIndexUser = 0;
	
	// уровень который проходит пользователь
	var m_Level = 1;
	// в каждом уровне есть подуровин а это их счетчик
	var m_subLevel = 0;
	
	// номер текущего хода
	var m_nIndexStep  = 1;
	//---------------------------------------------------------------
	// private function
	
	// Создаем в теге тело игры
	//createBady();
	// 
	init();
	
	//---------------------------------------------------------------
	// инициализируем
	function init()
	{
		// создаем массив ячеек 
		// забиваем их пустыми значениями
		for (i = 0; i < 9; i++)
			m_arr[i] = '_';

		// в ячейки устанавливаем обработчики
		m_cell
			.hover(onMouseInCells, onMouseOutCells)
			.click(onMouseClickCells)
			.fadeTo(1,CrossToeStyle.alphaCell)
			.each(function (i) { 				// перебираем все ячейки
				$(this).data('index', i); 		// каждой ячейке свой индекс
				$(this).data('XO', '_');		// информация что в ячейке на прямую
		});
		
		// инициализируем меню
		// главное меню
		var Button = m_mainSelector.children('#panel #menu:first');
		var Menu = Button.next();
		new CMenu(Menu, Button);

		// обработчики для главного меню
		// реализация вообще херня но 4 часа утра голова не варит
		// доработать потом
		var ev = Menu.find('li').find('a:first')
			.each(function (i) {
				switch(i)
				{
					case 0: $(this).click(MenuNewGame) ;break;
					case 1: $(this).click(MenuAcrade) ;break;
					case 2: $(this).click(MenuDemo) ;break;
					case 3: $(this).click(MenuAbaut) ;break;
				}
				});
	
		// меню сложности
		var Button = Menu.next(); m_menuLevels = Button;
		Menu = Button.next();
		new CMenu(Menu, Button);

		// обработчик
		Menu.find('li > a').each(function (i) {
			$(this).data('index', i);}) // каждому элементу совй индекс
			.click(MenuSelectlevel);	// при клике на пунт меню
		
		
		// обработчик для кнопок в нижней панели
		var sel = m_mainSelector.find('#panel #information')
			.children('#button_O').click(Button_O)
			.next('#button_X').click(Button_X);
			
		m_Information = sel.next();
	}
	
	//---------------------------------------------------------------
	// Заполняем найденный тег данными игры
	function createBady()
	{
		m_mainSelector.html('');
	}
	
	//---------------------------------------------------------------
	// Освобожаем ресурсы выделенные под этот обьект
	this.free = function()
	{	

	};
	
	//---------------------------------------------------------------
	// Очистить ячейки от крестиков и линий
	function Reset()
	{
		// если сброс уже был значит выходим
		if (m_reset)
			return;
		m_GameSataus = 'stop';	
		m_nIndexStep = 1; // текущий ход
		
		// чистим массив с данными о ячейках
		for (i = 0; i < 9; i++)
			m_arr[i] = '_';
			
		// убираем удяляем все линии зачеркивания если они есть
		m_mainSelector.find('#lines > div')
			.fadeTo(CrossToeStyle.animatedSpeedIn, 0.0, function(){
				$(this).parent().html('');});	

		//	не могу понять почему .fadeTo(CrossToeStyle.animatedSpeedIn, 0.0, function()
		// запускаеться несколько раз мне нужно что бы было 1 раз для этого эта переменная
		var one = false;
		// чистим и скрываем все что в ячейках
		m_cell
			.css('cursor', '')
			.data('XO', '_')		// информация что в ячейке на прямую
			.children().stop()
			.fadeTo(CrossToeStyle.animatedSpeedIn, 0.0, function()
			{
				// для одноразового вызова этой функции
				if (one)
					return;
					
				// дожидаемся полного окончания анимация
				// удаляем html
				m_cell.html('');

				// настраиваем статус на работу
				m_GameSataus = 'run';
				m_reset = true;
				
				// изменяем значение что бы ходил уже другой игрок
				m_cheiHod = !m_cheiHod;
				
				// если это простая игра и ходит первым компьютер тогда
				if (m_gameType == 'NewGame' && m_cheiHod)
					BotDummong();// ходим
					
				one = true;				
			});
	}	

	//---------------------------------------------------------------
	// Меню новая игра
	function MenuNewGame()
	{
		// человек ходит мервым
		m_cheiHod = true;
		m_gameType = 'NewGame';
		
		// меняем информациооное табло на режим NewGame
		m_Information
			.animate({top:'-50px'},400, function () 
			{
				// изменяем информацию о выгрышах	
				SetResultInformation();
				
				// анимируем
				$(this)
					.animate({top:'0px'}, 400)			
					.prev().animate({left:'0px'},400)
					.prev().animate({left:'0px'},400, function(){
						m_menuLevels.animate({marginRight:'0px'}, 400);});
			});
		
		// сбрасываем все ячейки
		Reset();
	}
	
	//---------------------------------------------------------------
	// меню на прохождение
	function MenuAcrade()
	{
		// человек ходит первым
		m_cheiHod = true;
		m_gameType = 'Arcade';
		
		// изменяем информационное табо на режим Arcade
		m_menuLevels.animate({marginRight:'-90px'}, 400, function()
		{
			m_Information
				.animate({top:'-50px'},400, function () 
				{
					// изменяем описание выйрышей
					SetResultInformation();
					$(this).animate({top:'0px'}, 400);
				})
				.prev().animate({left:'34px'},400)
				.prev().animate({left:'-34px'},400);
		});
	
		Reset();
	}
	
	//---------------------------------------------------------------
	// меню о программе
	function MenuAbaut()
	{
		alert('MenuAbaut В разработке');
	}
	
	//---------------------------------------------------------------
	// меню о программе
	function MenuDemo()
	{
		alert('MenuDemo В разработке');
	}
	
	//---------------------------------------------------------------
	// для всех пунктов меню выбр уровня сложности
	function MenuSelectlevel()
	{
		// узнаем индекс элемента меню
		var index  = $(this).data('index');
	
		// устанавливаем его
		m_userLevel = index;
		var text;
		// устанавливаем уровень сложности в зависимости от выбранного мею
		// в данный момент не знаю как считать текст то тега span и буду указывать явно
		switch(index)
		{
			case 4:
				text = 'Очень легко';
				break;
			case 3:
				text = 'Легко';
				break;
			case 2:
				text = 'Нормально';
				break;
			case 1:
				text = 'Тяжело';
				break;
			case 0:
				text = 'Экста тяжело';
				break;
		}
		
		$(this).parent().parent().prev().text(text);
		// перезагружаем игру
		m_cheiHod = true;
		Reset();
	}
	
	//---------------------------------------------------------------
	// Пользователь перешел в пользователя нолик
	function Button_O()
	{
		alert('Button_O()');
		m_currentPlayer = 'O';
		m_botPlayer = 'X';
		m_cheiHod = true;
		Reset();
	}
	
	//---------------------------------------------------------------
	// Пользователь перешел в пользователя крестик
	function Button_X()
	{
		alert('Button_X()');
		m_currentPlayer = 'X';
		m_botPlayer = 'O';
		m_cheiHod = true;
		Reset();
	}
	
	//---------------------------------------------------------------
	// Наведение мыши на ячейку
	function onMouseInCells()
	{
		if (m_GameSataus != 'run')
			return;
			
		// Кешируем этот элемент
		var _this = $(this);
		
		// если он анимируеться тогда останавливае его
		if (_this.is(':animated'))
			_this.stop();
		
		// если ячейка не занята тогда будем показывать подсказку
		// в виде крестика или нолика в зависимости от выбора пользователя
		var active = _this.data('XO');
		
		if (active == '_')
		{
			// кешируем #XO
			var XO = _this.find('.'+m_currentPlayer);
			
			// Если его не существует
			if (XO.length <= 0)
			{
				// создаем новый
				_this.html('<div class="'+m_currentPlayer+'"></div>');
				XO = _this.children('.'+m_currentPlayer);
			}
			// если он анимируеться тогда останавливаем
			else if (XO.is(':animated'))
				XO.stop();
				
			// анимируем показываем его
			XO.fadeTo(CrossToeStyle.animatedSpeedIn, CrossToeStyle.alphaHide);
		}
		else
		{
			var XO = _this.children('.'+active);
			
			// если он анимируеться тогда останавливаем
			if (XO.is(':animated'))
				XO.stop();
				
			XO.fadeTo(CrossToeStyle.animatedSpeedIn, CrossToeStyle.alphaActiveHover);
		}
	}
	
	//---------------------------------------------------------------
	// отведение мыши от ячейки
	function onMouseOutCells()
	{
		if (m_GameSataus != 'run')
			return;
			
		// кэшируем элемент
		var _this = $(this);
		
		// если анимируеться то останавливаем
		if (_this.is(':animated'))
			_this.stop();
		
		// если эта ячейка не занята тогда мы показывали подсказку
		// и должны её убрать
		var active = _this.data('XO');
		
		if (active == '_')
		{
			// Кэщируем
			var XO = _this.children('.'+m_currentPlayer);
			
			// если она анимировалась останавливаем
			if (XO.is(':animated'))
				XO.stop();
				
			// скрываем ячейку и после всего удаляем из HTML
			XO.fadeTo(CrossToeStyle.animatedSpeedOut, 0.0, 
				function () 
				{
					// когда пользователь отводит мышку от этой чейки
					// нам нужно узнать вдруг в этот момет робот поставил сюда
					// свой крестик тогда мы не будем удалять потому что робот сам её заменит
					// на свою
					if (_this.data('XO') == '_')
						_this.html('');
				});
		}
		else
		{
			var XO = _this.children('.'+active);
			
			// если он анимируеться тогда останавливаем
			if (XO.is(':animated'))
				XO.stop();
				
			XO.fadeTo(CrossToeStyle.animatedSpeedOut, CrossToeStyle.alphaActive);
		}
	}
	
	//---------------------------------------------------------------
	// установить X или O в ячейку
	// возвращяет true если в ячеку было что то установленно 
	// и она не была до этого занята
	function SetXO(_cell, XO)
	{
		if (typeof(_cell) == 'number')
			_cell = $(m_cell[_cell]);

		// Если ячейка уже заполнена тогда выходим
		if (_cell.data('XO') != '_')
			return false;
		
		m_reset = false;
		// Делаем ячейку заполненной
		_cell.data('XO', XO);
		
		// Устанавливаем в массив
		m_arr[_cell.data('index')] = XO;
		_cell
			.css('cursor', 'default')
			.html('<div class="'+XO+'"></div>')	// добавляем в ячейку
			.children('.'+XO)					// то что мы только что добавили
				.fadeTo(0,CrossToeStyle.alphaHide)// прозрачность какx была у подсказки
				.fadeTo(CrossToeStyle.animatedSpeedIn,CrossToeStyle.alphaActiveHover);
		
		m_nIndexStep++;// прибалвяем теущий ход
		return true;
	}
		
	//---------------------------------------------------------------
	// Установить информацию о выигрышах проигрышах
	function SetResultInformation(IndexLine, XO)
	{
		// показываем линию зачеркивания
		if (typeof(IndexLine) == 'number')
		{
			m_mainSelector.find('#lines')
				.html('<div id="line'+IndexLine+'"></div>')
				.find('#line'+IndexLine).fadeTo(0, 0.0)
				.fadeTo(CrossToeStyle.animatedSpeedIn, 1.0);
		}
		
		if (m_gameType == 'NewGame')
		{
			if (typeof(IndexLine) == 'number')
			{
				// если текущий пользователь выйграл
				if (m_currentPlayer == XO[0])
					m_nIndexUser++;	// добаляем ему очко
				else ( m_botPlayer == XO[0]) // если выйграл компьютер
					m_nIndexBot++; // добаляем ему очко
			}
			else
			{
				m_nIndexUser = 0;
				m_nIndexBot = 0;
			}
			m_Information.text(m_nIndexBot+'/'+m_nIndexUser);
		}
		else if(m_gameType == 'Arcade')
		{
			if (typeof(IndexLine) == 'number')
			{
			}
			else
			{
				m_Level = 1;
				m_subLevel = 0;
			}
			
			m_Information.html('<span>Уровень: '+m_Level
					+'<br/></span><span>подуровни: '+m_subLevel+' из 5</span>');
		}
		// расчитываем ширину текстового поля
		// в зависимости от него центрируем 
		// пнель с кнопками и текстовым полем
		// может и можно обойтись без этого, а сделать все средсвами css
		// оставлю для оптимизации кода
		var w = m_Information.width()+72;
		m_Information.parent().css({ 'margin-left':parseInt(195-(w/2))+'px',
									 'width':w+'px' });
	}
	
	//---------------------------------------------------------------
	// Проверяет выйгрышь
	function CheckResult(result)
	{
		var XO = ['XXX', 'OOO'];

		var Result = [
			[0,1,2],[3,4,5],[6,7,8],[0,3,6],
			[1,4,7],[2,5,8],[0,4,8],[2,4,6]
		];

		for (i = 0; i < 2; i++) // проверка X O
			for (j = 0; j < 8; j++) // проверка всез 8 кобинаций
			{
				// формируем из трех ячеек
				var cel = '';
				for (x = 0; x < 3; x++) 
					cel += m_arr[Result[j][x]];

				// проверяем совпадения
				if (XO[i] == cel)
				{
					m_GameSataus = 'stop';
					
					// устанавливаем информацию о выйгреше
					SetResultInformation(j, cel);

					// Устанавливаем сбросс через время
					setTimeout(Reset, 500);
					
					return true;
				}
			}
			
		// если хоть одна ячейка пустая будем возвращять false	
		for (i = 0; i < 9; i++)	
			if (m_arr[i] == '_')
				return false;
		
		// если дошли до сюда значит никто не победил 
		// и все ячейи заняты
		m_GameSataus = 'stop';
		setTimeout(Reset, 500);
		return true;
	}

	//---------------------------------------------------------------
	// 
	function rand(r)
	{
		var result;
		r++;
		do
		{
			result = parseInt(Math.random()*r)
		}while(result == r);
		
		return result;
	}
	//---------------------------------------------------------------
	// дает победную ячейку
	function GetVCell(X, O)
	{
		// массив правильных резултатов
		var cell3 = [	[1,2,0],[0,2,1],[0,1,2],
						[5,4,3],[3,5,4],[3,4,5],
						[7,8,6],[6,8,7],[6,7,8],
						[0,3,6],[0,6,3],[6,3,0],
						[1,4,7],[1,7,4],[4,7,1],
						[2,5,8],[2,8,5],[5,8,2],
						[0,4,8],[0,8,4],[8,4,0],
						[2,4,6],[2,6,4],[6,4,2]];
		// массив для добавления рпавильных резултатов
		// алгоритм которой представлен ниже может выдавать 
		// несколько правильных решений, для этого мы наполняем массив
		// правильными ответами а потом выбераем на угад любой
		var arr_result = [];

		if (O == '_')
		{
			for (var i = 0; i < 24; i++)
			{
				// если нашли правильный ответ
				if (m_arr[cell3[i][0]] == '_'  && m_arr[cell3[i][1]] == '_' 
						&& m_arr[cell3[i][2]] == X)
						{
							arr_result.push(cell3[i][0]); 
							arr_result.push(cell3[i][1]); 
						}	
			}
		}
		else
		{
			// если нашли правильный ответ
			for (var i = 0; i < 24; i++)
			{
				if (m_arr[cell3[i][0]] == X  && m_arr[cell3[i][1]] == X 
							&& m_arr[cell3[i][2]] == '_')
						arr_result.push(cell3[i][2]); // тогда добавляем его в массив
			}
		}

		// если правильных ответов нету тогда выходим
		if (arr_result.length == 0)
			return -1;	
		else
		{
			// находим одинаковые ответы  и плюсуем их приоритет
			var ar = [0,0,0,0,0,0,0,0,0];
			var maxpriotity = 0; // максимальный приоритет
			for(i = 0; i < arr_result.length; i++)
			{
				if (++ar[arr_result[i]] > maxpriotity)
					maxpriotity = ar[arr_result[i]];	
			}
			
			// фильтр по приоритетам
			var arr_result = [];
			for(i = 0; i < ar.length; i++)
			{
				if (ar[i] == maxpriotity)
					arr_result.push(i);	
			}
			
			// второй фильтр по приоритетам
			// у всех угловых приоритет больше
			var ar =[]
			for(i = 0; i < arr_result.length; i++)
			{
				if (arr_result[i] == 0 || arr_result[i] == 2 
						|| arr_result[i] == 6 || arr_result[i] == 8)
					ar.push(arr_result[i]);
			}
			if (ar.length == 0)
				ar = arr_result;
				
			return ar[rand(ar.length-1)];
		}
		return -1;
	}
	
	//---------------------------------------------------------------
	// дает умный результат в зависимости от состояния крестика нолика
	// проверяет все ловушки и ставит ловушки сам если это возможно
	// данная функция не оптимизирована
	function GetTrepCell()
	{

		// шаблоны
		if (m_nIndexStep == 1) return 4; 	// первый ход в центр
		else if (m_nIndexStep == 2)			// второй ход
		{
			if (m_arr[4] == '_') return 4;	// если центр не занят тогда в центр
			else
			{
				// наполняем массив ячейками которые не ловуки и не заняты
				var ar = [];
				if (m_arr[0] == '_') ar.push(0);
				if (m_arr[2] == '_') ar.push(2);
				if (m_arr[6] == '_') ar.push(6);	
				if (m_arr[8] == '_') ar.push(8);

				// из этих ячеек выбераем наугад
				return ar[rand(ar.length-1)];
			}
		}
		// НАПАДЕНИЕ
		// тут спроэктировать разныем пути нападения
		// ...
		// ЗАЩИТА
		// ситуация когда пользователь ходит первым, на четвертом ходе
		else if (m_nIndexStep == 4 && m_arr[4] == m_botPlayer && !m_cheiHod)
		{
			var ar = [];
			// ловушки уловые
			if(m_arr[1] == m_currentPlayer && m_arr[3] == m_currentPlayer)
			{
				ar.push(0);
				ar.push(2);
				ar.push(6);
			}
			else if(m_arr[3] == m_currentPlayer && m_arr[7] == m_currentPlayer)	
			{
				ar.push(0);
				ar.push(6);
				ar.push(8);
			}
			else if(m_arr[7] == m_currentPlayer && m_arr[5] == m_currentPlayer)
			{
				ar.push(2);
				ar.push(6);
				ar.push(8);
			}
			else if(m_arr[5] == m_currentPlayer && m_arr[1] == m_currentPlayer)
			{
				ar.push(0);
				ar.push(7);
				ar.push(8);
			}
			// ловушки косые уловые
			else if ((m_arr[0] == m_currentPlayer && m_arr[8] == m_currentPlayer)
						|| (m_arr[6] == m_currentPlayer && m_arr[2] == m_currentPlayer))
			{
				if (m_arr[1] == '_') ar.push(1);
				if (m_arr[3] == '_') ar.push(3);
				if (m_arr[5] == '_') ar.push(5);
				if (m_arr[7] == '_') ar.push(7);
			}
			// г подобная ловушка
			else if ((m_arr[2] == m_currentPlayer && m_arr[7] == m_currentPlayer)
					|| (m_arr[0] == m_currentPlayer && m_arr[7] == m_currentPlayer))
			{
				ar.push(3);
				ar.push(5);
				ar.push(6);
				ar.push(8);
			}
			else if ((m_arr[3] == m_currentPlayer && m_arr[8] == m_currentPlayer)
					|| (m_arr[3] == m_currentPlayer && m_arr[2] == m_currentPlayer))
			{
				ar.push(0);
				ar.push(1);
				ar.push(6);
				ar.push(7);
			}
			else if ((m_arr[1] == m_currentPlayer && m_arr[6] == m_currentPlayer)
					|| (m_arr[1] == m_currentPlayer && m_arr[8] == m_currentPlayer))
			{
				ar.push(0);
				ar.push(2);
				ar.push(3);
				ar.push(5);
			}
			else if ((m_arr[0] == m_currentPlayer && m_arr[5] == m_currentPlayer)
					|| (m_arr[6] == m_currentPlayer && m_arr[5] == m_currentPlayer))
			{
				ar.push(1);
				ar.push(2);
				ar.push(7);
				ar.push(8);
			}
			if (ar.length)
				return ar[rand(ar.length-1)];	
		}
		
		return -1;
	}
	
	//---------------------------------------------------------------
	// дает номер ячейки куда нужно поставить крестик или нолик
	function GetBotPXO()
	{
		// проверка на ловушки
		var XO = GetTrepCell()
		
		if (XO != -1)
			return XO;

		// поиск двух ботов подряд
		XO = GetVCell(m_botPlayer);
	
		if (XO != -1)
			return XO;
	
		// поиск двух плееров подряд
		XO = GetVCell(m_currentPlayer);

		if (XO != -1)
			return XO;
		
		XO = GetVCell(m_botPlayer, '_');

		if (XO != -1)
			return XO;

		do{
			XO = rand(8);
		}while ( m_arr[XO] != '_');

		return XO;
	}
	//---------------------------------------------------------------
	// Бот думает и ставит 
	function BotDummong()
	{
		SetXO(GetBotPXO(), m_botPlayer);
	}
	
	//---------------------------------------------------------------
	// Клик мыши по ячейке
	function onMouseClickCells()
	{
		if (m_GameSataus != 'run')
			return;
			
		// Кэшируем
		var _this = $(this);
		
		// Устанавливаем крестик или нолик
		// если ничего не установленно тогда выходим
		if (!SetXO(_this, m_currentPlayer))
			return;
			
		// пока будем думать остановим игру
		m_GameSataus = 'pause';	
		
		// Проверяем если кто то выйграл тогда выход
		if (CheckResult())
			return;
		
		// Даем роботу подумать и сделать свой ход
		BotDummong();
		
		// Проверяем если кто то выйграл тогда выход
		if (CheckResult())
			return;	
			
		m_GameSataus = 'run';		
	}
	
	//---------------------------------------------------------------

	return this;
};
//-------------------------------------------------------------------
// Находит  <div id="crossToe"></div> на странице
// и помещяет туда экземпляр крестика нолика
function InitAllCrossToe(id)
{
	$(id+' ').each(function(index)
	{
        //new CrossToe($(this));
    });
}

$(document).ready(function(e) 
{
	//CCrossToe.Init('crossToe');
	//var ct = new CrossToe('#crossToe');
	new CrossToe('#crossToe');
});
