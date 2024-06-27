import { initializeApp } from "firebase/app"
import {getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where, Timestamp, Query} from "firebase/firestore"
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider ,signInWithPopup} from "firebase/auth"
import { CronJob } from 'cron'

import {ExpanseData} from './interfaces'
import {BarData, mainCurrency} from './data'

import * as d3 from 'd3'

declare global {
    const d33: typeof d3
}

///FIREBASE SETUP

const firebaseConfig = {
  apiKey: "AIzaSyBZFAO65T7tdu8ANxgU7WVNhDBNuTowyiw",
  authDomain: "sacker-e5832.firebaseapp.com",
  databaseURL: "https://sacker-e5832-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sacker-e5832",
  storageBucket: "sacker-e5832.appspot.com",
  messagingSenderId: "790176915935",
  appId: "1:790176915935:web:4eb85a22ee11dc1de9a46a"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const GoogleProvider = new GoogleAuthProvider()
    auth.useDeviceLanguage()



onAuthStateChanged(auth, (user) => {
    if(user){
        showLoggedInView()
        periodBtnsColorLogic()
        setExpensesHtml('day',moneySpendTotalMainPage!)
        getPeriodParagraphId(oneDayContainer!)

    }
    else{
        showLoggedOutView()
    }
})

// DOM VARIABLES 
const menuButton = document.getElementById('menu-button')
const addExpenseBtn = document.getElementById('add-expense-btn')
const loginFormContainer = document.getElementById('login-form-container')
const mainApp = document.getElementById('main-app')
const signInBtn = document.getElementById('sign-in-btn')
const createAccBtn = document.getElementById('create-acc-btn')
const signInWithGoogleBtn = document.getElementById('sign-with-google-btn')
const moneySpendTotalMainPage = document.getElementById('money-spend-total')

const emailInputLogin = document.getElementById!('email-input-login') as HTMLInputElement
const passwordInputLogin = document.getElementById!('password-input-login') as HTMLInputElement
const periodButtons = document.getElementsByClassName('period-buttons') as HTMLCollectionOf<HTMLElement>;

/// PERIOD BUTTONS

const oneDayContainer = document.getElementById('1DAY')
const weekContainer =  document.getElementById('7DAYS')
const monthContainer = document.getElementById('MONTH')
const yearContainer = document.getElementById('YEAR')


const periodDataExpansesPara = document.getElementById('period-expanses') as HTMLElement

const barSection = document.getElementById('bar-section') as HTMLElement

const showMoreBtn = document.getElementById('show-more-main-page') as HTMLElement

const moneySpendCurrencyP = document.getElementById('money-spend-currency')

const charDataContainer = document.getElementById('char-data-container') as HTMLElement
/// VARIABLES

const collectionName = 'expanses'
let showMoreActive = false


/// EVENTLISTENERS
menuButton?.addEventListener('click', renderMenu)
addExpenseBtn?.addEventListener('click', renderExpenseInputsField)
createAccBtn?.addEventListener('click',() => {
   authCreateUserWithEmailAndPassword()
})

signInBtn?.addEventListener('click',authSignInWithEmailAndPassword)

signInWithGoogleBtn?.addEventListener('click', () => {
    SignInWithGoogle()
   
})

oneDayContainer?.addEventListener('click',() => getPeriodParagraphId(oneDayContainer))

weekContainer?.addEventListener('click', () => getPeriodParagraphId(weekContainer))

monthContainer?.addEventListener('click', () => getPeriodParagraphId(monthContainer))

yearContainer?.addEventListener('click',() => getPeriodParagraphId(yearContainer))

showMoreBtn?.addEventListener('click', () => {
    renderSimilarBars(getPeriodQuery('day'))
})

// FUNCTIONS 

function renderCharPieExpansesData(data:any){
    let wholeData = Object.entries(data)
    const colorClasses = ['text-color1', 'text-color2', 'text-color3', 'text-color4', 'text-color5'];
    let counter = 0
    const charPieExpansesDataContainer = document.createElement('div')
    charPieExpansesDataContainer.classList.add('animate-fade','animate-duration-[1000ms]')
    wholeData.forEach(item =>{
        const dataDiv = document.createElement('p')
        const colorClass = colorClasses[counter];
        const value = item[1] as number
        dataDiv.innerHTML = `<span class="${colorClass} font-bold m-2 mb-4">${item[0]}</span>: ${value.toFixed(2)} <span class="text-[#4992FF]">${mainCurrency}</span>`
        counter++
        charPieExpansesDataContainer.appendChild(dataDiv)
    })
    charDataContainer.innerHTML = ''
    charDataContainer?.appendChild(charPieExpansesDataContainer)
}

type CharData = {
    label: string;
    value: number;
};

function renderCharPie(data: any) {
    let CharData: CharData[] = [
        { label: 'FOOD', value: data.FOOD || 0 },
        { label: 'BILLS', value: data.BILLS || 0 },
        { label: 'FUN', value: data.FUN || 0 },
        { label: 'DEVELOPMENT', value: data.DEV || 0 },
        { label: 'OTHER', value: data.OTHER || 0 }
    ];

    const isEmptyData = CharData.every(d => d.value === 0);
    if (isEmptyData) {
        CharData = [{ label: 'No Data', value: 1 }];
    }

    const width = 150; 
    const height = 150;
    const radius = Math.min(width, height) / 2;

    const color = d3.scaleOrdinal<string>()
        .domain(CharData.map(d => d.label))
        .range(isEmptyData ? ['#d3d3d3'] : ['#7C47BE', '#20AFA7', '#4992FF', '#DBDE36', '#34CB3A']);

    d3.select('.chart svg').remove();

    const svg = d3.select('.chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'animate-fade')
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie<CharData>()
        .value((d: { value: any }) => d.value)
        .sort(null);

    const arc = d3.arc<d3.PieArcDatum<CharData>>()
        .innerRadius(50)
        .outerRadius(radius);

    const arcs = svg.selectAll<SVGGElement, d3.PieArcDatum<CharData>>('.arc')
        .data(pie(CharData))
        .enter().append('g')
        .attr('class', 'arc');

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d: { data: { label: any } }) => color(d.data.label));
}

  
async function getAllPeriodDataFromDB(period: 'day' | 'week' | 'month' | 'year'){
    let dataArr:any = []
    const {start, end} = getTimeRange(period)
    const user = auth.currentUser
    const q = query(collection(db, collectionName), where("uid", "==", user?.uid), where("currency", "==", mainCurrency), where("serverTimestamp", ">=" ,start), where("serverTimestamp", "<=" ,end))
    const querySnapshot = await getDocs(q)
    querySnapshot.forEach((doc) => {
       dataArr.push(doc.data())
    })
   return dataArr
}


function sortExpansesByCategory(dataArr:ExpanseData[]){
    
    let FOOD = 0
    let BILLS = 0
    let FUN = 0
    let DEV = 0
    let OTHER = 0

    dataArr.forEach(item =>{
        switch(item.category){
                case 'FOOD':
                    FOOD += Number(item.price)
                    break
                
                case 'BILLS':
                    BILLS += Number(item.price)
                    break

                case 'FUN':
                    FUN += Number(item.price)
                    break
                
                case 'DEVELOPMENT':
                    DEV += Number(item.price)
                    break
                case 'OTHER':
                    OTHER += Number(item.price)
                    break
                default:
                    throw new Error('No data found')
                
        }          
    })             
    return {FOOD, BILLS, FUN, DEV, OTHER}
}


async function renderSimilarBars(q:Query):Promise<void>{ 
    showMoreActive = !showMoreActive 
    let dayExpanses = await getPriceTotal(q)

    try{
        BarData.forEach(item => {
            let overPrice = 0
            const barContainer = document.createElement('div') as HTMLElement
            barContainer.id = 'bar-container'
            barContainer.classList.add('rounded-xl')
     
            const bar = document.createElement('div') as HTMLElement
            bar.id = 'bar'
            bar.classList.add('rounded-xl')


            const overPriceAndImageContainer = document.createElement('div')
            overPriceAndImageContainer.id = 'priceAndImageContainer'

            const overPriceParagraph = document.createElement('p')
            overPriceParagraph.classList.add('tracking-wide','text-sm')
            const image = document.createElement('img')

            image.setAttribute('src',item.img)
            image.id = 'barImage'
            image.classList.add('w-10')

            const wholeBar = document.createElement('div')
            wholeBar.id = 'wholeBar'
            wholeBar.classList.add('animate-fade','animate-once','animate-ease-in-out','animate-normal','animate-fill-both')
            let barProgress = (dayExpanses / item.price) * 100
            
            let newBar = (barProgress / 100).toFixed(2).split('.')[1]
            if(barProgress > 100){
                overPrice = Math.floor(barProgress / 100)
               
                barProgress = 100
               
            }
            bar.style.width = `${newBar}%`
            overPriceParagraph.textContent = `x${overPrice.toString()}`

            if(showMoreActive){
                showMoreBtn.textContent = 'show less'
                barSection.style.display = 'flex'
                overPriceAndImageContainer.appendChild(image)
                overPriceAndImageContainer.appendChild(overPriceParagraph)
                barContainer.appendChild(bar)
                wholeBar.appendChild(barContainer)
                wholeBar.appendChild(overPriceAndImageContainer)
                barSection.appendChild(wholeBar)
            }
            else{
                showMoreBtn.textContent = 'show more'
                barSection.innerHTML = ''
            }
         })
    }
    catch(error){
        console.log(error)
    }

}


async function getPeriodParagraphId(element:HTMLElement){
    const paragraph = element.childNodes[1] as HTMLElement
   
    const period = getPeriodElementId(paragraph.id)
    const data = sortExpansesByCategory(await getAllPeriodDataFromDB(period))   
    renderCharPie(data)
    renderCharPieExpansesData(data)
   
    setExpensesHtml(period,periodDataExpansesPara)
    
}


function getPeriodElementId(id:any){
    return id.split('-')[0]
}


function getTimeRange(period: 'day' | 'week' | 'month' | 'year'): { start: Timestamp, end: Timestamp} {

    const now = new Date()
    let start: Date
    let end: Date

    switch (period) {
        case 'day':
            start = new Date(now.setHours(0, 0, 0, 0))
            end = new Date(now.setHours(23, 59, 59, 999))
            break
        case 'week':
            const startOfWeek = now.getDate() - now.getDay()
            start = new Date(now.setDate(startOfWeek))
            start.setHours(0, 0, 0, 0)
            end = new Date(now.setDate(startOfWeek + 6))
            end.setHours(23, 59, 59, 999)
            break
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1)
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            end.setHours(23, 59, 59, 999)
            break
        case 'year':
            start = new Date(now.getFullYear(), 0, 1)
            end = new Date(now.getFullYear(), 11, 31)
            end.setHours(23, 59, 59, 999)
            break
        default:
            throw new Error('Invalid period')
    }

    return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(end)}
}


function getPeriodQuery(period: 'day' | 'week' | 'month' | 'year'){
    const {start, end} = getTimeRange(period)
    const user = auth.currentUser
    const q = query(collection(db, collectionName), where("uid", "==", user?.uid), where("currency", "==", mainCurrency), where("serverTimestamp", ">=" ,start), where("serverTimestamp", "<=" ,end))
    return q

}


async function setExpensesHtml(period: 'day' | 'week' | 'month' | 'year',element:HTMLElement):Promise<void>{
    let price = await getPriceTotal(getPeriodQuery(period))
    moneySpendCurrencyP!.innerText = mainCurrency
    element.innerHTML = price.toFixed(2).toString()
    periodDataExpansesPara.innerHTML = `<p>${price.toFixed(2)} <span class="text-[#4992FF]">${mainCurrency}</span></p>`
    
}


async function getPriceTotal(q:Query): Promise<number>{
    let priceTotal:number = 0

    const querySnapshot = await getDocs(q)
    querySnapshot.forEach((doc) => {
    const wholeDoc = doc.data()
    const price = wholeDoc.price
    priceTotal += Number(price)
    
  
})
   return priceTotal
}



async function addExpanseToDB(price: string, currency: string, category: string, description: string) {
    const expanseId = Math.floor(Math.random() * 10000000000000)
    const user = auth.currentUser
    try {
        await addDoc(collection(db, collectionName), {
            price: price,
            currency: currency,
            category: category,
            description: description,
            uid: user?.uid,
            expanseId: expanseId,
            serverTimestamp: serverTimestamp()
        });
        setExpensesHtml('day', moneySpendTotalMainPage!)
        getPeriodParagraphId(oneDayContainer!)
    } catch (error) {
        alert("cannot add expense")
    }
}

function periodBtnsColorLogic(){
    for(let periodBtn of periodButtons){
        periodBtn?.addEventListener('click',(e:MouseEvent) => {
          const target = e.currentTarget as HTMLElement
         changeButtonColor(target.id)
        } )
    }
}

function changeButtonColor(buttonId: string){
    for(let peroidBtn of periodButtons){
        if(buttonId === peroidBtn.id){
            peroidBtn.classList.remove('bg-[#D4D4D4]')
            peroidBtn.classList.add("bg-[#20AFA7]", "text-white", "hover:bg-[#198781]")
        }
        else{
            peroidBtn.classList.remove("bg-[#20AFA7]", "text-white","hover:bg-[#198781]")
            peroidBtn.classList.add('bg-[#D4D4D4]')
        }
    }
}

function renderMenu(){
  
    hideAddExpenseBtn()

 
    const divMenuEl: HTMLDivElement = document.createElement('div')
    divMenuEl.classList.add('fixed', 'top-0','left-0', 'w-full','h-full', 'flex', 'items-center', 'justify-center', 'backdrop-filter', 'backdrop-blur-sm','animate-fade-up','animate-once','animate-duration-200')
     
    const menuEl: HTMLDivElement = document.createElement('div')
    menuEl.classList.add('bg-white','px-32','shadow-lg','flex','flex-col')

    const closeBtn: HTMLButtonElement = document.createElement('button')
    
    closeBtn.textContent = 'CLOSE'
    closeBtn.classList.add('text-red-600', 'px-6','py-2','bg-gray-300','mt-8','mb-2')

    closeBtn.addEventListener('click',() => {
        document.body.removeChild(divMenuEl)
        addExpenseBtn!.style.visibility = 'visible'
    })

    const logoutBtn: HTMLButtonElement = document.createElement('button')
    logoutBtn.textContent = 'LOG OUT'
    logoutBtn.classList.add('text-red-600','bg-red-300','px-6','py-2','mt-2')

    logoutBtn.addEventListener('click',() => {
        logOutEvent()
        document.body.removeChild(divMenuEl)
    })

    menuEl.appendChild(logoutBtn)
    menuEl.appendChild(closeBtn)
    divMenuEl.appendChild(menuEl)
    

    document.body.appendChild(divMenuEl)

}

function renderExpenseInputsField(){

    hideAddExpenseBtn()

    const expenseFieldsDiv = document.createElement('div')
    expenseFieldsDiv.classList.add('fixed','top-0','left-0','w-full','h-full','flex','flex-col','items-center','justify-center','backdrop-filter','backdrop-blur-sm','animate-fade-up','animate-once','animate-duration-200')


    let expenseField = `    
            <section class="bg-white shadow-md px-8 w-3/4 sm:w-1/2 ">
            <div id='close-btn' class="px-2 text-xl font-thin -mr-8 text-black float-right">
                <button>X</buttom>
            </div>
                <div class="flex flex-row items-center justify-between mt-6">
                <div class="flex flex-col">
                    <p>Add your new</p>
                    <p class="text-[#7C47BE] -mt-2">expense</p>
                </div>
                <div class="w-24 animate-bounce animate-infinite animate-duration-[4000ms] animate-delay-[1500ms] animate-ease-in-out animate-alternate-reverse animate-fill-both">
                    <img  src="./images/coin.png" alt="coin">
                </div>
                </div>
            
                <div>
                <form id="expense-form" method="POST" class="flex flex-col">
                    <input id="price-input" class="text-3xl w-36 bg-[#F1F1F1] placeholder:text-gray-400 outline-none rounded-md p-2 text-center text-black mb-4"
                     type="number" step="0.01" min="0" required placeholder="3.64">
                    <select id="currency-select" class="w-16 text-lg p-2 text-[#4992FF] rounded-md bg-[#F1F1F1]" required>
                        <option value="PLN">PLN</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                    </select>

                    <div class="flex flex-row mt-6  items-center justify-between ">
                    <div class-"flex flex-col ">
                        <p>select</p>
                        <p class="text-[#20AFA7] -mt-2">category</p>
                    </div>      
                        <div class="w-24 mr-10 animate-bounce animate-infinite animate-duration-[4000ms] animate-ease-in-out animate-alternate-reverse animate-fill-both">
                            <img  src="./images/coin.png" alt="coin">
                         </div>
                    </div>

                    <select id="category-select" class="w-24 p-2 text-lg rounded-md bg-[#F1F1F1] text-center relative" required>
                        <option value='FOOD'>FOOD</option>
                        <option value='BILLS'>BILLS</option>
                        <option value='FUN'>FUN</option>
                        <option value='DEVELOPMENT'>DEVELOPMENT</option>
                        <option value='OTHER'>OTHER</option>
                    </select>

                    <div class="mt-6">
                        <div>
                            <p>description</p>
                            <p class="text-[#7C47BE]">(optional)</p>
                        </div>
                        <div>
                            <textarea id="expense-description" class="mt-4 mb-6 w-full h-20 resize-none bg-[#F1F1F1] p-2 rounded-md" placeholder="description"></textarea>
                        </div>

                     </div>


                    <div id="end-div" class="flex flex-row items-center justify-between">
                        <div class="w-24 animate-bounce animate-infinite animate-duration-[4000ms] animate-delay-500 animate-ease-in-out animate-alternate-reverse animate-fill-both">
                            <img  src="./images/coin.png" alt="coin">
                        </div>
                     <button type="submit" class="bg-[#20AFA7] text-white px-4 py-1 rounded hover:bg-[#198c86]">ADD</button>
                    </div>
                </form>
                </div>     
            </section>

    `
    expenseFieldsDiv.insertAdjacentHTML('afterbegin', expenseField)
   document.body.appendChild(expenseFieldsDiv)


    const form = document.getElementById('expense-form')
    const closeBtn = document.getElementById('close-btn')

    const price = document.getElementById('price-input') as HTMLInputElement
    const currency = document.getElementById('currency-select') as HTMLSelectElement
    const category = document.getElementById('category-select') as HTMLSelectElement
    const description = document.getElementById('expense-description') as HTMLTextAreaElement

    form?.addEventListener('submit',(e) =>{
        e.preventDefault()
        addExpanseToDB(price.value,currency.value,category.value,description.value)
        document.body.removeChild(expenseFieldsDiv)
        showAddExpenseBtn()
        setExpensesHtml('day',moneySpendTotalMainPage!)

        
    })

    closeBtn?.addEventListener('click',() => {
        document.body.removeChild(expenseFieldsDiv)
       showAddExpenseBtn()
    })

}

async function authCreateUserWithEmailAndPassword(){
    
    const email = emailInputLogin.value
    const password = passwordInputLogin.value

   createUserWithEmailAndPassword(auth,email,password)
  .then((userCredential) => {
   console.log(userCredential);
  })
  .catch((error) => {
    showLoggedOutView()
    if(!email || !password){
        alert(error.message + ' Please, fill email and password fields before creating account')
    }
    if(!email.includes('@')){
        alert('Email must be an real email')
    }
    if(password.length < 6){
        alert('Password must be at least 6 characters long')
    }
  })
}

async function authSignInWithEmailAndPassword(e:Event){
    e.preventDefault()
    const email = emailInputLogin.value
    const password = passwordInputLogin.value

    signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    console.log(userCredential)
  })
  .catch((error) => {
   showLoggedOutView()
   alert(error.message)
   clearSignInInputs()
  })
}

async function SignInWithGoogle(){
    signInWithPopup(auth, GoogleProvider)
  .then((result) => {
    console.log(result);
  }).catch(() => {
    alert('something went wrong')
  })
}

async function logOutEvent(){
    signOut(auth).then(() => {
        clearSignInInputs()
       showLoggedOutView()
      }).catch((error) => {
        alert(error.message)
      })
}

function showLoggedInView(){
    mainApp?.classList.remove('hidden')
    loginFormContainer?.classList.add('hidden')
    showAddExpenseBtn()
}

function showLoggedOutView(){
    mainApp?.classList.add('hidden')
    loginFormContainer?.classList.remove('hidden')
}

function showAddExpenseBtn(){
    addExpenseBtn!.style.visibility = 'visible'
}

function hideAddExpenseBtn(){
    addExpenseBtn!.style.visibility = 'hidden'
}

function clearSignInInputs(){
    emailInputLogin.value = ''
    passwordInputLogin.value = ''
}

const day = new CronJob(
	'0 0 * * * *',
	function () {
        setExpensesHtml('day',moneySpendTotalMainPage!)
	},
	null,
	true, 
	'Europe/Warsaw' 
)

const week = new CronJob(
	'0 0 * * * 0',
	function () {
        setExpensesHtml('week',weekContainer!)
	},
	null,
	true, 
	'Europe/Warsaw' 
)

const month = new CronJob(
	'0 0 1 * *',
	function () {
        setExpensesHtml('month',monthContainer!)
	},
	null,
	true, 
	'Europe/Warsaw' 
)

const year = new CronJob(
	'0 0 1 1 *',
	function () {
        setExpensesHtml('year',yearContainer!)
	},
	null,
	true, 
	'Europe/Warsaw' 
)

day.start()
week.start()
month.start()
year.start()

