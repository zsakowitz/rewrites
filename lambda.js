const True = x => y => x;
const False = x => y => y;
const Not = x => x(False, True);
