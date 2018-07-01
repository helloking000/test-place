var node3 = {  //定义有三个节点的链表，这里要注意由与js是顺序解释的，如果开始定义node1,再定义node2，node1.next = node2,其实为undefined，所以链表节点要从尾节点定义
    value: "z",
    next: null
}
var node2 = {
    value: "y",
    next: node3
}

var node1 = {
    value: "x",
    next: node2
}
//从头打印链表各个节点的值，
function printList(listHead) {
    var p = listHead;
    while (p) {
        console.log(p.value)
        p = p.next;
    }
}

printList(node1);

function reverseList(node) {
    var newListTial = node;
    var p = newListTial.next;
    var q = p.next;

    newListTial.next = null;

    while(q.next) {
        p.next = newListTial;
        newListTial = p;
        p = q;
        q = q.next;
    }
}

reverseList(node1)
printList(node3);