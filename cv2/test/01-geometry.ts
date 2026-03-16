import {
    intersection,
    perpendicularbisector,
    point,
    segment,
    type Object,
} from "../tbd/geometry"
import { Scene } from "../tbd/scene"

const sc = new Scene<Object>()

const A = point(sc, [2, 3])
const B = point(sc, [4, 5])
const C = point(sc, [9, -3])

const pAB = perpendicularbisector(sc, segment(sc, A, B))
const pBC = perpendicularbisector(sc, segment(sc, B, C))

const O = intersection(sc, pAB, pBC)

console.log(sc.get(O).val)
sc.get(A).set!([9, 2])
console.log(sc.get(O).val)
