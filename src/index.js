import './operators'
import './rxjs'
import './subjects'


import {Subject} from 'rxjs'
import {EMPTY, fromEvent} from 'rxjs'
import {ajax} from 'rxjs/ajax'
import {map,debounceTime, distinctUntilChanged, mergeMap, tap, catchError, filter, pairwise, switchMap, takeUntil, withLatestFrom, startWith, scan, shareReplay} from 'rxjs/operators'


//================
// rxjs redux

const initialState = {
  counter: 0
}

const pre = document.querySelector('pre')

const handlers = {
  INCREMENT: state => ({...state, counter: state.counter + 1}),
  DECREMENT: state => ({...state, counter: state.counter - 1}),
  ADD: (state, action) => ({...state, counter: state.counter + action.payload}),
  DEFAULT: state => state
}

function reducer(state = initialState, action) {
  const handler = handlers[action.type] || handlers.DEFAULT
  return handler(state, action)
}

function createStore(rootReducer) {
  const subj$ = new Subject()

  const store$ = subj$.pipe(
    startWith({type: '__INIT__'}),
    scan(rootReducer, undefined),
    shareReplay(1)
  )

  store$.dispatch = action => subj$.next(action)

  return store$
}

const store$ = createStore(reducer)

store$.subscribe(state => {
  pre.innerHTML = JSON.stringify(state, null, 2)
})

document.getElementById('increment').addEventListener('click', () => {
  store$.dispatch({type: 'INCREMENT'})
})

document.getElementById('decrement').addEventListener('click', () => {
  store$.dispatch({type: 'DECREMENT'})
})

document.getElementById('add').addEventListener('click', () => {
  store$.dispatch({type: 'ADD', payload: 10})
})

//===========================
//API

const url = 'https://api.github.com/search/users?q='

const search = document.getElementById('search')
const result = document.getElementById('result')

const clear$ = fromEvent(document.getElementById('clear'),'click')

clear$.subscribe(() => {
  const canvas = document.querySelector('canvas')
  canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height)
})

const stream$ = fromEvent(search,'input')
  .pipe(map(e => e.target.value),
    debounceTime(1000),
    distinctUntilChanged(),
    tap(() => result.innerHTML = ''),
    tap(() => search.innerHTML = ''),
    filter(v => v.trim()),
    switchMap(v => ajax.getJSON(url + v).pipe(
      catchError(err => EMPTY)
    )),
    map(res => res.items),
    mergeMap(items => items)
    )

stream$.subscribe(user => {
  const html = ` <div class="card">
        <div class="card-image">
          <img src="${user.avatar_url}">
          <span class="card-title">${user.login}</span>
        </div>
        <div class="card-action">
          <a href="${user.html_url}" target="_blank">Open github</a>
        </div>
      </div>`
  result.insertAdjacentHTML('beforeend',html)
})

//=====================
//Canvas

const canvas = document.querySelector('canvas')
const range = document.getElementById('range')
const color = document.getElementById('color')

const ctx = canvas.getContext('2d')

const mouseMove$ = fromEvent(canvas, 'mousemove')
const mouseDown$ = fromEvent(canvas, 'mousedown')
const mouseUp$ = fromEvent(canvas, 'mouseup')
const mouseOut$ = fromEvent(canvas, 'mouseout')

function createInputStream(node) {
  return fromEvent(node, 'input')
  .pipe(
    map(e => e.target.value),
    startWith(node.value)
  )
}

const lineWidth$ = createInputStream(range)
const strokeStyle$ = createInputStream(color)

const stream2$ = mouseDown$
.pipe(
  withLatestFrom(lineWidth$, strokeStyle$, (_, lineWidth, strokeStyle) => {
    return {lineWidth, strokeStyle}
  }),
  switchMap(options => {
    return mouseMove$
    .pipe(
      map(e => ({
        x: e.offsetX,
        y: e.offsetY,
        options
      })),
      pairwise(),
      takeUntil(mouseUp$),
      takeUntil(mouseOut$)
    )
  })
)


stream2$.subscribe(([from, to]) => {
  const {lineWidth, strokeStyle} = from.options

  ctx.lineWidth = lineWidth
  ctx.strokeStyle = strokeStyle

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
})