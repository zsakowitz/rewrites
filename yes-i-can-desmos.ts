const a = document.querySelector(".session-state-cover")
const { elementFromPoint } = document
document.elementFromPoint = function (x, y) {
    if ((x == 5 && y == 5) || (x == innerWidth - 5 && y == innerHeight - 5)) {
        return a
    }
    return elementFromPoint.call(document, x, y)
}
a.parentElement.remove()

// var d=document,a=d.querySelector('.session-state-cover'),b=d.elementFromPoint;d.elementFromPoint=function(x,y){return(x==5&&y==5||x==innerWidth-5&&y==innerHeight-5)?a:b.call(this,x,y)};a?.parentElement?.remove()

// javascript:var%20d%3Ddocument%2Ca%3Dd.querySelector('.session-state-cover')%2Cb%3Dd.elementFromPoint%3Bd.elementFromPoint%3Dfunction(x%2Cy)%7Breturn(x%3D%3D5%26%26y%3D%3D5%7C%7Cx%3D%3DinnerWidth-5%26%26y%3D%3DinnerHeight-5)%3Fa%3Ab.call(this%2Cx%2Cy)%7D%3Ba%3F.parentElement%3F.remove();void 0
