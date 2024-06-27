export interface ExpanseData{
    price:string;
    currency:string;
    category:string;
    description?:string;
    uid:string;
    expanseId:number;
    serverTimestamp:string;
}

export interface SimilarBarData{
    price:number;
    img:string;
}

export interface CurrencyInfo{
    Name:string;
    State:number;
}

export interface CharData{
    label:string;
    value:number;
}