# bitcoin-closure
*A project by Serena Randolph and [Austin Williams](https://onename.com/austinwilliams)*

**bitcoin-closure** is a tool for computing the closure of a bitcoin address.

## What is the Closure of a Bitcoin Address?
The closure of a bitcoin address is defined recursively as follows:

1. An address is contained in its own closure.
2. If address A is in the closure, and there exists a transaction using coins from address A and address B as inputs, then address B is also in the closure.

The motivation is that if two addresses appear together as inputs in some transaction, then the two addresses are very likely to be controlled by the same entity. **As a result, all of the addresses in the closure of an address are very likely owned by the same entity***.

This linking was noted by Satoshi Nakamoto in the [Bitcoin whitepaper](https://bitcoin.org/bitcoin.pdf) (page 6):
> “Some linking is still unavoidable with multi-input transactions, which necessarily
reveal that their inputs were owned by the same owner. The risk is that if the owner
of a key is revealed, linking could reveal other transactions that belonged to the
same owner.”


You can read more about closures at these links:

* [Evaluating User Privacy inBitcoin](https://docs.google.com/viewer?url=http%3A%2F%2Ffc13.ifca.ai%2Fproc%2F1-3.pdf)
* [A Fistful of Bitcoins: Characterizing Payments Among Men with No Names](https://docs.google.com/viewer?url=http%3A%2F%2Fcseweb.ucsd.edu%2F~smeiklejohn%2Ffiles%2Fimc13.pdf)
* [An Analysis of Anonymity in the Bitcoin System](http://arxiv.org/abs/1107.4524)
* [Trustless Bitcoin Anonymity Here at Last](https://bitcoinmagazine.com/6630/trustless-bitcoin-anonymity-here-at-last/)


(*) There are important exceptions. Coinjoin transactions for example, contain inputs from three or more distinct entities -- yet all the addresses used as inputs to a coinjoin transaction are contained in the same closure.

## Getting Started

### JavaScript Web Interface
Coming very soon...


### Python Command Line Tool
First grab the files from this repo:

`$ git clone https://github.com/sharkcrayon/identitybits`

Dig into the python folder:

```
$ cd identitybits
$ cd python
```

Install the Blockchain API library:

`pip install blockchain`

Alternatively, you could install the Blockchain API manually:

```
$ git clone https://github.com/blockchain/api-v1-client-python
$ cd api-v1-client-python
$ python setup.py install
```

That's it. You should be good to go.
To find the closure of an address just use the following command from command line:

`$ python closure.py 'address'`

As a good first example, try this command:

`$ python closure.py 1L2JsXHPMYuAa9ugvHGLwkdstCPUDemNCf`

And [here is a list](http://www.theopenledger.com/9-most-famous-bitcoin-addresses/) of some fun addresses to play around with.

### More about Closures
Let **X** be the set of all bitcoin addresses.
We will write A ~ B whenever bitcoin address A is in the closure of bitcoin address B.

The following properties hold for the relation ~ defined on the set of all bitcoin addresses, and are easy to prove from the definition of closure:

**Reflexive**: ∀A ∈**X**, A~A. 

**Symmetric**: ∀A,B ∈ **X**, A~B ⇒ B~A.

**Transitive**: ∀A,B,C ∈**X**, A~B & B~C ⇒ A~C

Thus ~ induces an [equivalence relation](https://en.wikipedia.org/wiki/Equivalence_relation) on **X**. It follows that the set of all bitcoin addresses can be partitioned into closures of addresses.

For those researchers doing blockchain analysis, it may be useful to consider whether your analysis can be extended from individual bitcoin addresses to entire the entire closures. For example, rather than simply analysizing the traditional bitcoin-transaction graph, you may also want to study the closure-transaction graph -- where the vertices are bitcoin closures and there exists a directed edge from _closureA_ to _closureB_ if any address in _closureA_ has sent funds to any address in _closureB_.
