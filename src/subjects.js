// import {BehaviorSubject, Subject, ReplaySubject} from 'rxjs'
//
//
// document.addEventListener('click', () => {
//
//   // const stream$ = new Subject()
//   const stream$ = new ReplaySubject(2)
//   // const stream$ = new BehaviorSubject('First!')
//   stream$.subscribe(v => console.log(v))
//   stream$.next('Hello')
//   stream$.next('RxJs')
//   stream$.next('!')
//
// })