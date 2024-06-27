import {SimilarBarData} from './interfaces'
import {Currency} from './Currency'

export let mainCurrency = Currency.PLN.Name
export let currenctState = Currency.PLN.State

export const BarData:SimilarBarData[] = [
    {
        price:5 / currenctState,
        img:'./images/barDataImages/redbull.png'
    },
    {
        price:15 / currenctState,
        img:'./images/barDataImages/coffie.png'
    },
    {
        price:799 / currenctState,
        img:'./images/barDataImages/airpodspro.png'
    },
    {
        price:2600 / currenctState,
        img:'./images/barDataImages/home-playstation-desktop.png'
    },
    {
        price:5799/ currenctState,
        img:'./images/barDataImages/iphone15.png'
    },

]


