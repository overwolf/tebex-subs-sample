export default function ArraysIntersect<Type>(arr1: Type[], arr2: Type[]) {
  return (
    // Does arr 1 NOT contain ANY value that is not included in arr 2 - AND
    !arr1.some((item) => !arr2.includes(item)) &&
    // Does arr 2 NOT contain ANY value that is not included in arr 1
    !arr2.some((item) => !arr1.includes(item))
  );
}
