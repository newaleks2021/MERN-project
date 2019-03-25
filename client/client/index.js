import './styles/index.scss';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from'./store';
import Base from './components/Base';
import 'bootstrap/dist/css/bootstrap.min.css';

render(
  <Provider store={store}>
    <BrowserRouter>
      <Base />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
);
