#include<iostream>
#include<vector>
#include<math.h>
#include<queue>
using namespace std;

#include "json.hpp"
using json = nlohmann::json;

struct Balance{
    string userId;
    double amount;
};
struct Transaction{
    string from;
    string to;
    double amount;
};

vector<Transaction> greedySettle(vector<Balance> &balances){
    priority_queue<pair<double, string>>  creditors;
    priority_queue<pair<double, string>>  debtors;

    for(auto ele:balances){
        if(ele.amount > 1e-9) creditors.push({ele.amount, ele.userId});
        else if(ele.amount < -1e-9) debtors.push({-ele.amount, ele.userId});
    }

    vector<Transaction> result;

    while(!creditors.empty() && !debtors.empty()){
        double creditAmt = creditors.top().first;
        string creditor = creditors.top().second;
        creditors.pop();   

        double debtAmt = debtors.top().first;
        string debtor = debtors.top().second;
        debtors.pop();   

        double settle = min(creditAmt, debtAmt);
        result.push_back({debtor, creditor, settle});

        if(creditAmt - debtAmt > 1e-9) creditors.push({creditAmt - debtAmt, creditor});
        else if(debtAmt - creditAmt > 1e-9) debtors.push({debtAmt - creditAmt, debtor});
    }

    return result;
}

int main(){
    json input;
    cin>>input;

    vector<Balance> balances;

    for(auto ele:input["balances"]){
        balances.push_back({ele["userId"].get<string>(), ele["amount"].get<double>()});
    }

    vector<Transaction> result = greedySettle(balances);
    
    json output = json::array();

    for(auto ele:result){
        output.push_back({
            {"from", ele.from},
            { "to", ele.to},
            {"amount", round(ele.amount * 100) / 100}}
        );    
    }

    cout<<output.dump()<<endl;
    return 0;
}