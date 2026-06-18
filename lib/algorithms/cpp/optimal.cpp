#include<iostream>
#include<vector>
#include<math.h>
#include<queue>
#include<climits>
using namespace std;

#include "json.hpp"
using json = nlohmann::json;

struct Transaction{
    string from;
    string to;
    double amount;
};

int main(){
    json input;
    cin >> input;

    vector<string> userIds;
    vector<double> amounts;

    for(auto ele:input["balances"]){
        double amt = ele["amount"].get<double>();

        if(abs(amt) > 1e-9){
            userIds.push_back(ele["userId"].get<string>());
            amounts.push_back(amt);
        }
    }

    double totalSystemSum = 0.0;
    for (double amt : amounts) {
        totalSystemSum += amt;
    }
    if (abs(totalSystemSum) > 1e-9) {
        cerr << "Error: Total balances do not sum to zero!" << endl;
        return 1; 
    }

    int n = amounts.size();
    int states = 1 << n;

    vector<double> sum(states, 0.0);

    for(int mask = 1;mask < states;mask++){
        int lsb = mask & (-mask);
        int bit = __builtin_ctz(lsb);
        sum[mask] = sum[mask ^ lsb] + amounts[bit];
    }

    vector<int> dp(states, INT_MAX);
    dp[0] = 0;
    
    for(int mask = 1;mask < states;mask++){
        if(abs(sum[mask]) < 1e-9){
            dp[mask] = __builtin_popcount(mask) - 1;
        }

        for(int sub = (mask - 1) & mask;sub > 0;sub = (sub - 1) & mask ){
            if(dp[sub] != INT_MAX && dp[sub ^ mask] != INT_MAX){
                dp[mask] = min(dp[mask], dp[sub] + dp[mask^sub]);
            }
        }
    }

    priority_queue<pair<double, int>> creditors;
    priority_queue<pair<double, int>> debtors;

    for (int i = 0; i < n; i++) {
        if (amounts[i] > 1e-9) creditors.push({amounts[i], i});
        else debtors.push({-amounts[i], i});
    }

    vector<Transaction> result;

    while (!creditors.empty() && !debtors.empty()) {
        double creditAmt = creditors.top().first;
        int creditIdx = creditors.top().second;
        creditors.pop();

        double debtAmt = debtors.top().first;
        int debtIdx = debtors.top().second;
        debtors.pop();

        double settle = min(creditAmt, debtAmt);
        result.push_back({userIds[debtIdx], userIds[creditIdx], settle});

        if (creditAmt - debtAmt > 1e-9) creditors.push({creditAmt-debtAmt, creditIdx});
        else if (debtAmt - creditAmt > 1e-9) debtors.push({debtAmt-creditAmt, debtIdx});
    }

    json output;

    output["transactions"] = json::array();
    output["optimalCount"] = dp[states - 1] == INT_MAX ? -1 : dp[states - 1];
    output["greedyCount"] = result.size();

    for (auto& ele : result) {
        output["transactions"].push_back({
            {"from", ele.from},
            {"to", ele.to},
            {"amount", round(ele.amount * 100) / 100}
        });
    }

    cout << output.dump() << endl;
    return 0;
}