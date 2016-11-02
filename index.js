const moment = require("moment")
const _ = require("lodash")
const defaultCurrency = {
   name: "USD"
  ,value: 3
}

var analytics = {};
let analyticsList = require('./list.json')

const utils = {
  getModel: function(name, totalName, hasChildren){
    let model = {
      name: name,
      values:{

      },
      total:{
        name: totalName,
        conversions: 0,
        commission: 0
      }
    }

    if( hasChildren ){
      model.children = {}
    }

    return model;

  },

  getCurrencyModel: function(currency){
    return {
      name: currency,
      conversions: 0,
      commission: 0
    };
  }
}

const updateCommission = function updateCommission(node)
{
  node.total.conversions++
  node.total.commission += commissionCurrency
  node.values[currency].conversions++
  node.values[currency].commission += commission
}


const totalName = "Total in " + defaultCurrency
const getModel = utils.getModel
const getCurrencyModel = utils.getCurrencyModel



//console.log(item)
var occurrencePeriod = _.curry((period,occurrence) =>
    //moment(occurrence.pbTime).get(period)
    moment(occurrence.pbTime).format(period)
)

var occurrenceHour = occurrencePeriod('YYYY-MM-DD HH')
var occurrenceDay = occurrencePeriod('YYYY-MM-DD')
var occurrenceMonth = occurrencePeriod('YYYY-MM')
var occurrenceYear = occurrencePeriod('YYYY')

var groupToPeriod = function(group, key){
    return {
        name: key,
        times: group
    }
};

var reduceToPeriod = (p,v) => {
    let comm = v.times.reduce((o,i) => o += parseFloat(i.commission),0.00)
    p[v.name] = p[v.name] || {
                                count         : 1,
                                commission    : comm.toFixed(2),
                                commissionUSD : (comm/defaultCurrency.value).toFixed(2)
                              }
    return p
}
//var groupToMonth =groupToPeriod('month',)
var i = 1
let output =
  _(analyticsList)
  .groupBy(occurrenceHour)
  .map(groupToPeriod)
  .reduce(reduceToPeriod,{})

  console.log(JSON.stringify(output,null,2))

/*
analyticsList.forEach(function(item){

  let date = item.pbTime;
  let year = moment(date).get('year');
  let month = moment(date).get('month');
  let day = moment(date).get('date');
  let hour = moment(date).get('hour');
  let currency = item.currency;
  let commission = item.commission//app.utils.moneyValidation(item.commission);
  let commissionCurrency = item.commission * 3//app.utils.toUSD(req, currency, date, commission);


})
*/
