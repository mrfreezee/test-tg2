import './App.css';
import React, { useState, useEffect } from 'react';
import { useInitData, useWebApp } from '@vkruglikov/react-telegram-web-app';

const App = () => {
  const { InitData } = useInitData();
  const webApp = useWebApp();

  const [menuVisible, setMenuVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [orderCreatedModalVisible, setOrderCreatedModalVisible] = useState(false);
  const [rubValue, setRubValue] = useState('');
  const [lztValue, setLztValue] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const conversionRate = 1.2;

  const queryParams = new URLSearchParams(window.location.search);
  const order_id = queryParams.get('order_id');
  const method_id = queryParams.get('method_id');

  useEffect(() => {
    if (order_id && method_id) {
      fetchOrderData(order_id, method_id, InitData);
    }
  }, [order_id, method_id, InitData]);

  const fetchOrderData = async (order_id, method_id, init_data) => {
    try {
      const response = await fetch('https://vivadev.ru/market/mini_app/calc_order/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id,
          method_id,
          init_data,
        }),
      });
      const data = await response.json();
      if (data.error) {
        handleErrors(data.error);
      } else {
        setOrderData(data);
        setRubValue(data.min);
        setLztValue((data.min * conversionRate).toFixed(2));
      }
    } catch (e) {
      setError('Произошла ошибка при получении данных. Попробуйте позже.');
    }
  };

  const sendAmount = async () => {
    try {
      const response = await fetch('https://vivadev.ru/market/mini_app/calc_order/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id,
          method_id,
          amount_rub: rubValue,
          init_data: InitData,
        }),
      });
      const data = await response.json();
      if (data.error) {
        handleErrors(data.error);
      } else {
        setOrderCreatedModalVisible(true);
        setTimeout(() => {
          if (webApp?.WebApp) {
            webApp.WebApp.close();
          } else {
            console.error('Telegram WebApp API не доступен');
          }
        }, 5000);
      }
    } catch (e) {
      setError('Произошла ошибка при отправке суммы. Попробуйте позже.');
    }
  };

  const handleErrors = (errorCode) => {
    switch (errorCode) {
      case 'limit_error':
        alert('Некорректная сумма. Обновляем данные ордера...');
        fetchOrderData(order_id, method_id, InitData);
        break;
      case 'order_not_exist':
        alert('Ордер не существует или был закрыт.');
        break;
      case 'actual_payment_detected':
        alert('У вас есть незавершенный платеж. Завершите текущую сделку.');
        break;
      default:
        alert('Произошла неизвестная ошибка.');
    }
  };

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleRubInput = (event) => {
    const value = parseFloat(event.target.value) || '';
    setRubValue(value);
    setLztValue((value * conversionRate).toFixed(2));
  };

  const handleLztInput = (event) => {
    const value = parseFloat(event.target.value) || '';
    setLztValue(value);
    setRubValue((value / conversionRate).toFixed(2));
  };

  const updateButtonState = () => {
    return parseFloat(rubValue) > 0 || parseFloat(lztValue) > 0;
  };

  const closeModal = () => {
    setModalContent(null);
  };

  const ask = () => {
    setModalContent({
      title: 'Информация',
      message: 'Каждый продавец выставляет свой курс по отношению к выбранной валюте. Учитывайте, что он может быть разным у каждого продавца. Воспользуйтесь калькулятором, чтобы понимать сколько средств вы получите в итоге',
    });
  };

  const report = () => {
    setModalContent({
      title: 'Жалоба подана',
      message: 'Администрация примет меры в ближайшее время.',
    });
  };

  const confirmSwap = () => {
    setConfirmationModalVisible(true);
  };

  const proceedSwap = () => {
    sendAmount();
    setConfirmationModalVisible(false);
  };

  const goToBot = () => {
    window.location.href = "https://t.me/p2plolz_bot";
  };

  const closeConfirmation = () => {
    setConfirmationModalVisible(false);
    setLztValue('');
    setRubValue('');
  };

  return (
    <div className="App">
      <div className="top-bar">
        <div className="user-info">
          <div className="avatar">F</div>
          <div>
            <div className="username">Fantep</div>
            <div className="user-rating">Рейтинг: 65%</div>
          </div>
        </div>
        <div className="menu-icon" onClick={toggleMenu}>⋮</div>
        {menuVisible && (
          <div className="menu-dropdown" id="menu-dropdown">
            <button onClick={ask}>Информация</button>
            <button onClick={report}>Пожаловаться</button>
          </div>
        )}
      </div>

      {modalContent && (
        <div className="modal-overlay" id="modal-overlay">
          <div className="modal">
            <h2>{modalContent.title}</h2>
            <p>{modalContent.message}</p>
            <button className="close-button" onClick={closeModal}>×</button>
          </div>
        </div>
      )}

      <div className="content">
        {error && <div className="error">{error}</div>}
        <div className="info-box">
          <h2>Условия сделки</h2>
          <p>Метод оплаты: {orderData?.pm_name || 'СберБанк'}</p>
          <p>Продавец: {orderData?.nickname || 'Fantep'}</p>
          <p>Рейтинг: {orderData?.rating || '65%'}</p>
          <p>Минимальная сумма: {orderData?.min || '1000'} руб</p>
          <div className="highlight-text">Курс: 1 LZT RUB = {conversionRate} руб</div>
        </div>

        {orderCreatedModalVisible && (
          <div className="modal-overlay" id="order-created-modal">
            <div className="modal">
              <h2>Ордер создан</h2>
              <p>Теперь перейдите в бота для дальнейших инструкций.</p>
              <button className="modal-button-bot" onClick={goToBot}>Перейти в бота</button>
            </div>
          </div>
        )}

        <div className="swap-container">
          <div className="swap-input-container">
            <label className="swap-input-label" htmlFor="rub-input">Я отдам:</label>
            <div className="swap-input-wrapper">
              <input
                type="text"
                inputMode='numeric'
                id="rub-input"
                className="swap-input"
                value={rubValue}
                onChange={handleRubInput}
                placeholder="Введите сумму в RUB"
              />
              <div className="currency-container">
                <img src="ruble.png" alt="RUB" className="currency-image" />
              </div>
            </div>
          </div>

          <div className="swap-input-container">
            <label className="swap-input-label" htmlFor="lzt-input">Я получу:</label>
            <div className="swap-input-wrapper">
              <input
                type="text"
                inputMode='numeric'
                id="lzt-input"
                className="swap-input"
                value={lztValue}
                onChange={handleLztInput}
                placeholder="Введите сумму в LZT"
              />
              <div className="currency-container">
                <img src="lztrub.png" alt="LZT" className="currency-image" />
              </div>
            </div>
          </div>
          <div className="swap-result" id="swap-result">Вы получите на баланс: {lztValue} LZT RUB</div>
          <button
            className={`swap-button ${updateButtonState() ? 'active' : ''}`}
            onClick={confirmSwap}
            disabled={!updateButtonState()}
          >
            Подтвердить
          </button>
        </div>
      </div>

      {confirmationModalVisible && (
        <div className="modal-overlay" id="confirmation-modal">
          <div className="modal">
            <h2>Подтверждение обмена</h2>
            <div className="amount-container">
              <p>Вы отдаёте</p>
              <div className="amount-box">
                <span id="confirm-give-amount">{rubValue} RUB</span>
                <img src="ruble.png" alt="RUB" className="currency-icon" />
              </div>
            </div>

            <div className="amount-container">
              <p>Вы получаете</p>
              <div className="amount-box">
                <span id="confirm-receive-amount">{lztValue} LZT RUB</span>
                <img src="lztrub.png" alt="LZT RUB" className="currency-icon" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button className="button confirm" onClick={proceedSwap}>Перейти</button>
              <button className="button cancel" onClick={closeConfirmation}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
