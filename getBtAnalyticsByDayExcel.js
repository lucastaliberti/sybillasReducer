'use strict';
module.exports = function*( app, req, res ) {

  const moment = require("moment");
  const defaultCurrency = "USD";

  const analyticsCollection = app.mongodb['analytics'].collection('bt-analytics');

  if (req.body.analytics === undefined || req.body.analytics === {}) {
    return app.utils.setResponse(req, res, 400, "ANALYTICS_OBJECT_NOT_FOUND", null);
  }

  let analyticsForm = req.body.analytics;

  let query = app.modules.analytics.utils.getQuery(req, analyticsForm);

  if ( !query.status ) {
      return app.utils.setResponse(req, res, 500, "ERROR", query);
  }

  let fieldList = {
    pbTime: true,
    commission: true,
    currency: true
  };

  query.data.commission = { $ne: null };
  let analyticsList = yield analyticsCollection.find(query.data, fieldList).toArray();

  let currencyQuery = app.utils.getCurrencyQuery(
     analyticsForm.startDate,
     analyticsForm.endDate,
     "USD"
  );

  const currencyCollection = app.mongodb['currency'].collection('currency');
  let currencyList = yield currencyCollection.find( currencyQuery ).toArray();

  app.utils.loadCurrencyData( req, currencyList, defaultCurrency );

  const totalName = "Total in " + defaultCurrency;
  const getModel = app.modules.analytics.utils.getModel;
  const getCurrencyModel = app.modules.analytics.utils.getCurrencyModel;
  const buildAnalytics = app.modules.analytics.utils.buildAnalytics;
  const buildAnalyticsExcel = app.modules.analytics.utils.buildAnalyticsExcel;

  var analytics = {};

  analyticsList.forEach(function(item){

    let date = item.pbTime;
    let year = moment(date).get('year');
    let month = moment(date).get('month');
    let day = moment(date).get('date');
    let hour = moment(date).get('hour');
    let currency = item.currency;
    let commission = app.utils.moneyValidation(item.commission);
    let commissionCurrency = app.utils.toUSD(req, currency, date, commission);

    if( analytics['Total'] === undefined ){
      analytics['Total'] = getModel('Total', "Total in " + defaultCurrency, true);
    }

    if(analytics['Total']
      .values[currency] === undefined){

      analytics['Total']
        .values[currency] = getCurrencyModel(currency);

    }

    if(analytics['Total']
      .children[year] === undefined ){

      analytics['Total']
        .children[year] = getModel(year, totalName, true);

    }

    if(analytics['Total']
      .children[year]
      .values[currency] === undefined){

      analytics['Total']
        .children[year]
        .values[currency] = getCurrencyModel(currency);

    }

    if(analytics['Total']
      .children[year]
      .children[month] === undefined ){

      analytics['Total']
        .children[year]
        .children[hour] = getModel(hour, totalName, false);

    }

    if(analytics['Total']
      .children[year]
      .children[hour]
      .values[currency] === undefined){

      analytics['Total']
        .children[year]
        .children[hour]
        .values[currency] = getCurrencyModel(currency);

    }

    analytics['Total'].total.conversions++;
    analytics['Total'].total.commission += commissionCurrency;
    analytics['Total'].values[currency].conversions++;
    analytics['Total'].values[currency].commission += commission;

    analytics['Total'].children[year].total.conversions++;
    analytics['Total'].children[year].total.commission += commissionCurrency;
    analytics['Total'].children[year].values[currency].conversions++;
    analytics['Total'].children[year].values[currency].commission += commission;

    analytics['Total'].children[year].children[month].total.conversions++;
    analytics['Total'].children[year].children[month].total.commission += commissionCurrency;
    analytics['Total'].children[year].children[month].values[currency].conversions++;
    analytics['Total'].children[year].children[month].values[currency].commission += commission;

    analytics['Total'].children[year].children[month].children[day].total.conversions++;
    analytics['Total'].children[year].children[month].children[day].total.commission += commissionCurrency;
    analytics['Total'].children[year].children[month].children[day].values[currency].conversions++;
    analytics['Total'].children[year].children[month].children[day].values[currency].commission += commission;

    analytics['Total'].children[year].children[month].children[day].children[hour].total.conversions++;
    analytics['Total'].children[year].children[month].children[day].children[hour].total.commission += commissionCurrency;
    analytics['Total'].children[year].children[month].children[day].children[hour].values[currency].conversions++;
    analytics['Total'].children[year].children[month].children[day].children[hour].values[currency].commission += commission;

  });

  let grid = buildAnalytics(analytics);
  let excelPath = null;
  
  if(grid.length > 0 ){
    excelPath = yield buildAnalyticsExcel(app, "Test", grid);
  }

  return excelPath

};
