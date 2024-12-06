export const addDebugMsg = (msg: string) => {
	const debugWIndow = document.getElementById('debug')
	const el = document.createElement('p')
	el.innerText = JSON.stringify(msg)
	debugWIndow?.prepend(el)
}
