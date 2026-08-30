async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/health');
    console.log(await res.text());
  } catch (err) {
    console.log(err.message);
  }
}
test();
